import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyProductsChanged, notifyOrdersChanged, notifyNotificationsChanged } from '../socket.js';

const router = express.Router();

/** GET /api/orders – list orders for the authenticated customer (adopter) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = String(req.userId);
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 }).lean();
    const withId = orders.map((o) => {
      const { _id, ...rest } = o;
      return {
        ...rest,
        id: _id.toString(),
        createdAt: o.createdAt?.toISOString?.() ?? new Date(o.createdAt).toISOString(),
        updatedAt: o.updatedAt?.toISOString?.() ?? new Date(o.updatedAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/orders – create order (checkout). Body: { address, items: [{ productId, quantity }] } */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = String(req.userId);
    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { address, items: rawItems, paymentMethod, cardLast4 } = req.body ?? {};
    const addressStr = address != null ? String(address).trim() : '';
    if (!addressStr) return res.status(400).json({ error: 'Delivery address is required' });
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const row of rawItems) {
      const productId = row.productId;
      const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
      if (!productId) continue;

      const product = await Product.findById(productId).lean();
      if (!product) return res.status(400).json({ error: `Product not found: ${productId}` });
      if (product.stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}" (available: ${product.stock})` });
      }

      const unitPrice = product.discount != null
        ? product.price * (1 - product.discount / 100)
        : product.price;
      const total = Math.round(unitPrice * quantity);
      subtotal += total;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity,
        unitPrice: Math.round(unitPrice),
        total,
        sellerId: product.sellerId ?? null,
      });
    }

    if (orderItems.length === 0) return res.status(400).json({ error: 'No valid items' });

    const shipping = 0;
    const total = subtotal + shipping;

    const orderPayload = {
      customerId: userId,
      customerName: user.name,
      customerEmail: user.email,
      address: addressStr,
      items: orderItems,
      subtotal,
      shipping,
      total,
      status: 'New',
      statusHistory: [{ status: 'New', at: new Date() }],
    };
    if (paymentMethod != null && String(paymentMethod).trim()) {
      orderPayload.paymentMethod = String(paymentMethod).trim();
    }
    if (cardLast4 != null && /^\d{4}$/.test(String(cardLast4))) {
      orderPayload.cardLast4 = String(cardLast4).slice(-4);
    }
    const order = await Order.create(orderPayload);
    const orderIdStr = order._id.toString();

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }
    notifyProductsChanged();
    notifyOrdersChanged();

    const uniqueSellerIds = [...new Set(orderItems.map((i) => i.sellerId).filter(Boolean))];
    for (const sellerId of uniqueSellerIds) {
      await Notification.create({
        sellerId,
        type: 'new_order',
        title: 'New order',
        message: `You have a new order #${orderIdStr.slice(-8)}`,
        link: `/dashboard/seller/orders?highlight=${orderIdStr}`,
        read: false,
      });
    }
    if (uniqueSellerIds.length > 0) notifyNotificationsChanged();

    const created = order.toJSON();
    if (created.items) {
      created.items = created.items.map((i) => ({
        ...i,
        productId: i.productId?.toString?.() ?? i.productId,
      }));
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

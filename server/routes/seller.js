import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Payout } from '../models/Payout.js';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyProductsChanged, notifyOrdersChanged, notifyNotificationsChanged } from '../socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'seller');

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create seller upload dir:', e.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const name = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, !!allowed);
  },
});

const router = express.Router();

/** GET /api/seller/products – list all products for the authenticated seller (for inventory, etc.) */
router.get('/products', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const products = await Product.find({ sellerId }).sort({ updatedAt: -1 }).lean();
    const withId = products.map((p) => {
      const { _id, ...rest } = p;
      return {
        ...rest,
        id: _id.toString(),
        createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
        updatedAt: p.updatedAt?.toISOString?.() ?? new Date(p.updatedAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/seller/products/:id – update stock and/or lowStockThreshold (own products only) */
router.patch('/products/:id', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId !== sellerId) return res.status(403).json({ error: 'Not your product' });
    const updates = {};
    if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
    if (req.body.lowStockThreshold !== undefined) updates.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No inventory fields to update' });
    const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    const { _id, ...rest } = updated;
    notifyProductsChanged();
    res.json({
      ...rest,
      id: _id.toString(),
      createdAt: updated.createdAt?.toISOString?.() ?? new Date(updated.createdAt).toISOString(),
      updatedAt: updated.updatedAt?.toISOString?.() ?? new Date(updated.updatedAt).toISOString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** GET /api/seller/overview – dashboard stats, recent orders, low stock, score */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

    const [orders, products] = await Promise.all([
      Order.find({ 'items.sellerId': sellerId }).sort({ createdAt: -1 }).lean(),
      Product.find({ sellerId }).lean(),
    ]);
    const productIds = products.map((p) => p._id);
    const reviewList = await Review.find({
      $or: [
        { sellerId },
        { productId: { $in: productIds } },
      ],
    }).lean();

    let todaysOrders = 0;
    let pendingOrders = 0;
    let monthRevenue = 0;
    const quantityByProduct = {};
    for (const order of orders) {
      const createdStr = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '';
      if (createdStr === todayStart) todaysOrders += 1;
      if (['New', 'Processing', 'Shipped'].includes(order.status)) pendingOrders += 1;
      const orderMonth = order.createdAt ? new Date(order.createdAt) : null;
      if (orderMonth && orderMonth.getMonth() === now.getMonth() && orderMonth.getFullYear() === now.getFullYear()) {
        for (const item of order.items || []) {
          if (item.sellerId === sellerId) monthRevenue += Number(item.total) || 0;
        }
      }
      if (order.status === 'Delivered') {
        for (const item of order.items || []) {
          if (item.sellerId === sellerId) {
            const pid = item.productId?.toString?.() ?? item.productId;
            if (pid) quantityByProduct[pid] = (quantityByProduct[pid] || 0) + (Number(item.quantity) || 0);
          }
        }
      }
    }

    const lowStockProducts = products
      .filter((p) => p.stock <= (p.lowStockThreshold ?? 0))
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold ?? 0,
      }));

    const averageRating = reviewList.length ? reviewList.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewList.length : 0;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;
    const totalOrders = orders.length || 1;
    const deliverySuccessRate = Math.round((deliveredCount / totalOrders) * 100);
    const cancelRate = Math.round((cancelledCount / totalOrders) * 100);
    const sellerScorePercent = Math.round(
      (averageRating * 10 + deliverySuccessRate * 0.5 - cancelRate * 0.5) * 2
    );
    const clampedScore = Math.max(0, Math.min(100, sellerScorePercent));

    const topSellingProductIds = Object.entries(quantityByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    const topSelling = topSellingProductIds
      .map((id) => products.find((p) => p._id.toString() === id))
      .filter(Boolean)
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock,
      }));

    const recentOrdersRaw = orders.slice(0, 5);
    const recentOrders = recentOrdersRaw.map((o) => {
      const { _id, ...rest } = o;
      const statusHistory = (rest.statusHistory || []).map((h) => ({
        status: h.status,
        at: h.at?.toISOString?.() ?? new Date(h.at).toISOString(),
      }));
      const items = (rest.items || []).map((i) => ({
        ...i,
        productId: i.productId?.toString?.() ?? i.productId,
      }));
      return {
        ...rest,
        items,
        id: _id.toString(),
        createdAt: o.createdAt?.toISOString?.() ?? new Date(o.createdAt).toISOString(),
        updatedAt: o.updatedAt?.toISOString?.() ?? new Date(o.updatedAt).toISOString(),
        statusHistory: statusHistory.length ? statusHistory : [{ status: rest.status, at: rest.createdAt ?? new Date().toISOString() }],
      };
    });

    res.json({
      todaysOrders,
      pendingOrders,
      monthRevenue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviewList.length,
      deliverySuccessRate,
      cancelRate,
      sellerScorePercent: clampedScore,
      topSelling,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/seller/orders – list orders that contain at least one item from this seller */
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const orders = await Order.find({ 'items.sellerId': sellerId }).sort({ createdAt: -1 }).lean();
    const withId = orders.map((o) => {
      const { _id, ...rest } = o;
      const statusHistory = (rest.statusHistory || []).map((h) => ({
        status: h.status,
        at: h.at?.toISOString?.() ?? new Date(h.at).toISOString(),
      }));
      const items = (rest.items || []).map((i) => ({
        ...i,
        productId: i.productId?.toString?.() ?? i.productId,
      }));
      return {
        ...rest,
        items,
        id: _id.toString(),
        createdAt: o.createdAt?.toISOString?.() ?? new Date(o.createdAt).toISOString(),
        updatedAt: o.updatedAt?.toISOString?.() ?? new Date(o.updatedAt).toISOString(),
        statusHistory: statusHistory.length ? statusHistory : [{ status: rest.status, at: rest.createdAt ?? new Date().toISOString() }],
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/seller/orders/:id – update order status (only for orders that have this seller's items) */
router.patch('/orders/:id', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const { id } = req.params;
    const newStatus = req.body.status;
    const valid = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(newStatus);
    if (!valid) return res.status(400).json({ error: 'Invalid status' });
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const hasMyItem = order.items.some((i) => i.sellerId === sellerId);
    if (!hasMyItem) return res.status(403).json({ error: 'Not your order' });
    const updated = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status: newStatus },
        $push: { statusHistory: { status: newStatus, at: new Date() } },
      },
      { new: true, runValidators: true }
    ).lean();
    const { _id, ...rest } = updated;
    const statusHistory = (rest.statusHistory || []).map((h) => ({
      status: h.status,
      at: h.at?.toISOString?.() ?? new Date(h.at).toISOString(),
    }));
    const items = (rest.items || []).map((i) => ({
      ...i,
      productId: i.productId?.toString?.() ?? i.productId,
    }));
    notifyOrdersChanged();
    res.json({
      ...rest,
      items,
      id: _id.toString(),
      createdAt: updated.createdAt?.toISOString?.() ?? new Date(updated.createdAt).toISOString(),
      updatedAt: updated.updatedAt?.toISOString?.() ?? new Date(updated.updatedAt).toISOString(),
      statusHistory: statusHistory.length ? statusHistory : [{ status: rest.status, at: rest.updatedAt ?? new Date().toISOString() }],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** GET /api/seller/reviews – list all reviews for the authenticated seller (by sellerId on review, or by product ownership for legacy reviews) */
router.get('/reviews', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const sellerProductIds = await Product.find({ sellerId }).select('_id').lean().then((ps) => ps.map((p) => p._id));
    const reviews = await Review.find({
      $or: [
        { sellerId },
        { productId: { $in: sellerProductIds }, $or: [{ sellerId: null }, { sellerId: { $exists: false } }] },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();
    if (reviews.length === 0) {
      return res.json([]);
    }
    const productIds = [...new Set(reviews.map((r) => r.productId).filter(Boolean))];
    const products = await Product.find({ _id: { $in: productIds } }).select('_id name').lean();
    const nameById = Object.fromEntries(products.map((p) => [p._id.toString(), p.name || 'Product']));
    const withId = reviews.map((r) => {
      const productIdStr = r.productId?.toString?.() ?? r.productId;
      return {
        id: r._id.toString(),
        productId: productIdStr,
        productName: nameById[productIdStr] ?? 'Product',
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment ?? '',
        createdAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/seller/earnings – total earnings, pending payout, chart data by period (monthly|weekly|daily), payouts */
router.get('/earnings', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const period = (req.query.period || 'monthly').toString().toLowerCase();
    const validPeriod = ['monthly', 'weekly', 'daily'].includes(period) ? period : 'monthly';

    const deliveredOrders = await Order.find({
      'items.sellerId': sellerId,
      status: 'Delivered',
    }).lean();

    let totalEarnings = 0;
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        if (item.sellerId === sellerId) totalEarnings += Number(item.total) || 0;
      }
    }

    const paidPayouts = await Payout.find({ sellerId, status: 'paid' }).lean();
    const totalPaid = paidPayouts.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const pendingPayout = Math.max(0, totalEarnings - totalPaid);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let chartData;

    if (validPeriod === 'daily') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const buckets = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.push({
          key: d.getTime(),
          label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          revenue: 0,
        });
      }
      for (const order of deliveredOrders) {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        orderDate.setHours(0, 0, 0, 0);
        const key = orderDate.getTime();
        let sellerShare = 0;
        for (const item of order.items || []) {
          if (item.sellerId === sellerId) sellerShare += Number(item.total) || 0;
        }
        const entry = buckets.find((b) => b.key === key);
        if (entry) entry.revenue += sellerShare;
      }
      chartData = buckets.map(({ label, revenue }) => ({ label, revenue }));
    } else if (validPeriod === 'weekly') {
      const now = new Date();
      const getWeekStart = (d) => {
        const x = new Date(d);
        const day = x.getDay();
        const diff = x.getDate() - day + (day === 0 ? -6 : 1);
        x.setDate(diff);
        x.setHours(0, 0, 0, 0);
        return x;
      };
      const seen = new Set();
      const buckets = [];
      for (let i = 0; i <= 5; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const weekStart = getWeekStart(d);
        const key = weekStart.getTime();
        if (seen.has(key)) continue;
        seen.add(key);
        buckets.push({
          key,
          label: `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]}`,
          revenue: 0,
        });
      }
      buckets.sort((a, b) => a.key - b.key);
      for (const order of deliveredOrders) {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const weekStart = getWeekStart(orderDate);
        const key = weekStart.getTime();
        let sellerShare = 0;
        for (const item of order.items || []) {
          if (item.sellerId === sellerId) sellerShare += Number(item.total) || 0;
        }
        const entry = buckets.find((b) => b.key === key);
        if (entry) entry.revenue += sellerShare;
      }
      chartData = buckets.map(({ label, revenue }) => ({ label, revenue }));
    } else {
      const now = new Date();
      const last6 = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6.push({ month: monthNames[d.getMonth()], monthIndex: d.getMonth(), year: d.getFullYear(), revenue: 0 });
      }
      for (const order of deliveredOrders) {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();
        let sellerShare = 0;
        for (const item of order.items || []) {
          if (item.sellerId === sellerId) sellerShare += Number(item.total) || 0;
        }
        const entry = last6.find((e) => e.monthIndex === orderMonth && e.year === orderYear);
        if (entry) entry.revenue += sellerShare;
      }
      chartData = last6.map(({ month, revenue }) => ({ label: month, revenue }));
    }

    const payoutDocs = await Payout.find({ sellerId }).sort({ createdAt: -1 }).limit(50).lean();
    const payouts = payoutDocs.map((p) => ({
      id: p._id.toString(),
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : undefined,
      createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
    }));

    res.json({
      totalEarnings,
      totalPaid,
      pendingPayout,
      period: validPeriod,
      chartData,
      payouts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/seller/notifications – list notifications for the authenticated seller, newest first */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
    const notifications = await Notification.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const withId = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message ?? '',
      link: n.link ?? null,
      read: !!n.read,
      createdAt: n.createdAt?.toISOString?.() ?? new Date(n.createdAt).toISOString(),
    }));
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/seller/notifications/:id/read – mark one notification as read */
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    const { id } = req.params;
    const doc = await Notification.findOne({ _id: id, sellerId });
    if (!doc) return res.status(404).json({ error: 'Notification not found' });
    await Notification.findByIdAndUpdate(id, { $set: { read: true } });
    notifyNotificationsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/seller/notifications/read-all – mark all notifications as read for the seller */
router.post('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const sellerId = String(req.userId);
    await Notification.updateMany({ sellerId }, { $set: { read: true } });
    notifyNotificationsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/seller/logo – upload seller logo (auth required). Saves to data/seller, updates User.logoUrl in DB. */
router.post('/logo', requireAuth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }
    const userId = req.userId;
    const relativePath = `/api/seller/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(userId, { $set: { logoUrl: relativePath } });
    return res.json({ url: relativePath });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

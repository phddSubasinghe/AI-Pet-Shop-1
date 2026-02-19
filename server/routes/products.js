import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { notifyProductsChanged } from '../socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'products');

// Ensure upload directory exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create upload dir:', e.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
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

/** Upload product images – saves to data/products, returns paths to store in DB */
router.post('/upload', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    const basePath = '/api/products/uploads';
    const urls = req.files.map((f) => `${basePath}/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** List all products (optionally filter by sellerId later) */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 }).lean();
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

/** List reviews for a product */
router.get('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const list = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
    const withId = list.map((r) => {
      const { _id, ...rest } = r;
      return {
        ...rest,
        id: _id.toString(),
        createdAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Create a review (customer feedback) */
router.post('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { customerName, customerEmail, rating, comment } = req.body ?? {};
    if (!customerName?.trim() || !customerEmail?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const sellerId = product.sellerId ? String(product.sellerId) : null;
    const doc = await Review.create({
      productId,
      sellerId,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      rating: numRating,
      comment: comment != null ? String(comment).trim() : '',
    });
    const created = doc.toJSON();
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Get one product by id (includes seller details when product has sellerId) */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const { _id, ...rest } = product;
    const payload = {
      ...rest,
      id: _id.toString(),
      createdAt: product.createdAt?.toISOString?.() ?? new Date(product.createdAt).toISOString(),
      updatedAt: product.updatedAt?.toISOString?.() ?? new Date(product.updatedAt).toISOString(),
    };
    if (product.sellerId) {
      const seller = await User.findById(product.sellerId)
        .select('name shopName contactNumber logoUrl')
        .lean();
      if (seller) {
        payload.seller = {
          name: seller.name ?? product.sellerName ?? 'Seller',
          shopName: seller.shopName ?? null,
          contactNumber: seller.contactNumber ?? null,
          logoUrl: seller.logoUrl ?? null,
        };
      }
    }
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Create product */
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const doc = await Product.create({
      name: body.name,
      category: body.category,
      price: body.price,
      discount: body.discount ?? null,
      stock: body.stock,
      lowStockThreshold: body.lowStockThreshold ?? 5,
      status: body.status ?? 'active',
      description: body.description ?? '',
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      sellerId: body.sellerId ?? null,
      sellerName: body.sellerName ?? null,
    });
    const created = doc.toJSON();
    notifyProductsChanged();
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Update product (full update) */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        name: body.name,
        category: body.category,
        price: body.price,
        discount: body.discount ?? null,
        stock: body.stock,
        lowStockThreshold: body.lowStockThreshold ?? 5,
        status: body.status ?? 'active',
        description: body.description ?? '',
        images: Array.isArray(body.images) ? body.images : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        ...(body.sellerId !== undefined && { sellerId: body.sellerId ?? null }),
        ...(body.sellerName !== undefined && { sellerName: body.sellerName }),
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Product not found' });
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

/** Patch product (e.g. toggle status only) */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
    const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Product not found' });
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

/** Delete product */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    notifyProductsChanged();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

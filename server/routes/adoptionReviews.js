import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AdoptionReview } from '../models/AdoptionReview.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'adoption-reviews');

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create adoption-reviews upload dir:', e.message);
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

function requireAdopter(req, res, next) {
  if (req.authUser?.role !== 'adopter') {
    return res.status(403).json({ error: 'Adopter access only.' });
  }
  next();
}

const router = express.Router();

/** GET /api/adoption-reviews – public list of happy match reviews (newest first) */
router.get('/', async (req, res) => {
  try {
    const reviews = await AdoptionReview.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const list = reviews.map((r) => ({
      id: r._id.toString(),
      adopterName: r.adopterName,
      petName: r.petName || null,
      image: r.image,
      rating: r.rating,
      message: r.message,
      createdAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/adoption-reviews – adopter submits a happy match review (image + rating + message) */
router.post('/', requireAuth, requireAdopter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }
    const rating = req.body.rating != null ? Number(req.body.rating) : 0;
    const message = (req.body.message || '').trim();
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const imagePath = `/api/adoption-reviews/uploads/${req.file.filename}`;
    const doc = await AdoptionReview.create({
      adopterId: req.userId,
      adopterName: req.authUser.name || 'Adopter',
      image: imagePath,
      rating,
      message,
    });
    const created = doc.toJSON();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

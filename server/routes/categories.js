import express from 'express';
import { Category } from '../models/Category.js';
import { notifyCategoriesChanged } from '../socket.js';

const router = express.Router();

/** List all categories (for seller dropdown and admin) – sorted by order then name */
router.get('/', async (req, res) => {
  try {
    const list = await Category.find().sort({ order: 1, name: 1 }).lean();
    const withId = list.map((c) => {
      const { _id, ...rest } = c;
      return { ...rest, id: _id.toString() };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Create category (admin) */
router.post('/', async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const doc = await Category.create({
      name: String(name).trim(),
      order: order != null ? Number(order) : 0,
    });
    const created = doc.toJSON();
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category name already exists' });
    res.status(400).json({ error: err.message });
  }
});

/** Update category (admin) */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (order !== undefined) updates.order = Number(order);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const updated = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    const { _id, ...rest } = updated;
    notifyCategoriesChanged();
    res.json({ ...rest, id: _id.toString() });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category name already exists' });
    res.status(400).json({ error: err.message });
  }
});

/** Delete category (admin) */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    notifyCategoriesChanged();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

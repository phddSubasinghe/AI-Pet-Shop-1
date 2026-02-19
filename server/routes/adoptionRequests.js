import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Pet } from '../models/Pet.js';
import { User } from '../models/User.js';
import { AdoptionRequest } from '../models/AdoptionRequest.js';
import { Notification } from '../models/Notification.js';
import { notifyAdoptionRequestsChanged, notifyNotificationsChanged } from '../socket.js';

const router = express.Router();

/** Require authenticated user to be an adopter */
function requireAdopter(req, res, next) {
  if (req.authUser?.role !== 'adopter') {
    return res.status(403).json({ error: 'Adopter access only. Sign in as an adopter to apply to adopt.' });
  }
  next();
}

/**
 * POST /api/adoption-requests – create an adoption request (auth required, adopter only).
 * Body: { petId, message?, compatibilityScore?, aiReasons? }
 * compatibilityScore: 0–100 (AI match score). aiReasons: string[].
 * Sends the request to the shelter in realtime via socket.
 */
router.post('/', requireAuth, requireAdopter, async (req, res) => {
  try {
    const userId = String(req.userId);
    const { petId, message, compatibilityScore, aiReasons } = req.body || {};
    if (!petId || !String(petId).trim()) {
      return res.status(400).json({ error: 'petId is required' });
    }

    const pet = await Pet.findOne({ _id: petId.trim(), archived: { $ne: true } }).lean();
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    if (pet.adoptionStatus !== 'Available' && pet.status !== 'available') {
      return res.status(400).json({ error: 'This pet is not available for adoption' });
    }

    const shelterId = String(pet.shelterId);
    const user = await User.findById(userId).select('name email address').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const address = (user.address && String(user.address).trim()) || '';

    const existing = await AdoptionRequest.findOne({
      adopterId: userId,
      petId: String(petId).trim(),
      status: { $nin: ['Rejected'] },
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied to adopt this pet' });
    }

    let score = null;
    if (compatibilityScore != null && compatibilityScore !== '') {
      const n = Number(compatibilityScore);
      if (Number.isFinite(n) && n >= 0 && n <= 100) score = Math.round(n);
    }
    const reasons = Array.isArray(aiReasons) ? aiReasons.filter((r) => typeof r === 'string').slice(0, 20) : [];

    const doc = await AdoptionRequest.create({
      adopterId: userId,
      adopterName: user.name || user.email?.split('@')[0] || 'Adopter',
      adopterEmail: user.email,
      adopterAddress: address || '',
      petId: String(pet._id),
      shelterId,
      petName: pet.name,
      status: 'New',
      compatibilityScore: score,
      aiReasons: reasons,
      message: message != null ? String(message).trim() : '',
    });

    await Notification.create({
      shelterId,
      type: 'request',
      title: 'New adoption request',
      message: `${user.name || user.email} applied to adopt ${pet.name}.`,
      link: '/dashboard/shelter/requests',
      read: false,
    });
    const payload = doc.toJSON();
    notifyAdoptionRequestsChanged(shelterId, doc._id.toString(), doc.adopterId?.toString());
    notifyNotificationsChanged();
    res.status(201).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

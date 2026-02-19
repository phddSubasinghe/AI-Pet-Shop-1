import express from 'express';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { AdoptionRequest } from '../models/AdoptionRequest.js';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyAdoptionRequestsChanged, notifyNotificationsChanged } from '../socket.js';

const router = express.Router();

/** Build public pet object for saved-pets list (same shape as GET /api/pets). */
function toSavedPet(p, shelter) {
  const ageNum = Number(p.age) ?? 0;
  const ageStr = ageNum < 1 ? `${Math.round(ageNum * 12)} months` : `${ageNum} year${ageNum !== 1 ? 's' : ''}`;
  const images = [p.image, ...(p.photos || [])].filter(Boolean);
  const adoptionStatusLower = (p.adoptionStatus || p.status || 'available').toLowerCase();
  const adoptionStatus = adoptionStatusLower === 'reserved' ? 'reserved' : adoptionStatusLower === 'adopted' ? 'adopted' : 'available';
  return {
    id: p._id.toString(),
    name: p.name,
    species: p.species ? String(p.species).charAt(0).toUpperCase() + String(p.species).slice(1) : '—',
    breed: p.breed || null,
    age: ageStr,
    gender: p.gender || 'unknown',
    energyLevel: p.energyLevel || null,
    weight: p.weight != null ? Number(p.weight) : null,
    height: p.height != null ? Number(p.height) : null,
    shelterId: p.shelterId,
    shelterName: shelter?.shelterName ?? '—',
    shelterEmail: shelter?.shelterEmail ?? null,
    shelterAddress: shelter?.shelterAddress ?? null,
    shelterPhone: shelter?.shelterPhone ?? null,
    adoptionStatus,
    images,
    listedAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
  };
}

/** Require authenticated user to be an adopter */
function requireAdopter(req, res, next) {
  if (req.authUser?.role !== 'adopter') {
    return res.status(403).json({ error: 'Adopter access only.' });
  }
  next();
}

/** GET /api/me/likes – list liked pet ids (auth required) */
router.get('/likes', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('likedPetIds').lean();
    const ids = user?.likedPetIds ?? [];
    return res.json({ petIds: Array.isArray(ids) ? ids : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/me/likes/:petId – toggle like (auth required) */
router.post('/likes/:petId', requireAuth, async (req, res) => {
  try {
    const { petId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const arr = user.likedPetIds ?? [];
    const has = arr.includes(petId);
    if (has) {
      user.likedPetIds = arr.filter((id) => id !== petId);
    } else {
      user.likedPetIds = [...arr, petId];
    }
    await user.save();
    return res.json({ liked: !has });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/me/wishlist – list wishlist pet ids (auth required) */
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wishlistPetIds').lean();
    const ids = user?.wishlistPetIds ?? [];
    return res.json({ petIds: Array.isArray(ids) ? ids : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/me/wishlist/:petId – toggle wishlist (auth required) */
router.post('/wishlist/:petId', requireAuth, async (req, res) => {
  try {
    const { petId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const arr = user.wishlistPetIds ?? [];
    const has = arr.includes(petId);
    if (has) {
      user.wishlistPetIds = arr.filter((id) => id !== petId);
    } else {
      user.wishlistPetIds = [...arr, petId];
    }
    await user.save();
    return res.json({ inWishlist: !has });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/me/wishlist-products – list wishlist product ids (auth required) */
router.get('/wishlist-products', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wishlistProductIds').lean();
    const ids = user?.wishlistProductIds ?? [];
    return res.json({ productIds: Array.isArray(ids) ? ids : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/me/wishlist-products/:productId – toggle product in wishlist (auth required) */
router.post('/wishlist-products/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const arr = user.wishlistProductIds ?? [];
    const has = arr.includes(productId);
    if (has) {
      user.wishlistProductIds = arr.filter((id) => id !== productId);
    } else {
      user.wishlistProductIds = [...arr, productId];
    }
    await user.save();
    return res.json({ inWishlist: !has });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/me/saved-pets – list saved (liked + wishlist) pets with full details for adopters */
router.get('/saved-pets', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('likedPetIds wishlistPetIds').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const liked = user.likedPetIds ?? [];
    const wishlist = user.wishlistPetIds ?? [];
    const petIds = [...new Set([...liked, ...wishlist])].filter(Boolean);
    if (petIds.length === 0) return res.json([]);
    const pets = await Pet.find({ _id: { $in: petIds }, archived: { $ne: true } }).lean();
    const shelterIds = [...new Set(pets.map((p) => p.shelterId))];
    const shelters = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('_id name email organizationName address contactNumberShelter')
      .lean();
    const shelterById = Object.fromEntries(
      shelters.map((u) => [
        u._id.toString(),
        {
          shelterName: (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
          shelterEmail: u.email || null,
          shelterAddress: u.address || null,
          shelterPhone: u.contactNumberShelter || null,
        },
      ])
    );
    const list = pets.map((p) => {
      const shelter = shelterById[p.shelterId];
      return toSavedPet(p, shelter);
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/me/saved-pets/:petId/remove – remove pet from both liked and wishlist (auth required) */
router.post('/saved-pets/:petId/remove', requireAuth, async (req, res) => {
  try {
    const { petId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const liked = user.likedPetIds ?? [];
    const wishlist = user.wishlistPetIds ?? [];
    user.likedPetIds = liked.filter((id) => id !== petId);
    user.wishlistPetIds = wishlist.filter((id) => id !== petId);
    await user.save();
    return res.json({ removed: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/me/profile – current user profile (auth required). Used for edit form. */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email role contactNumber address').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber ?? null,
      address: user.address ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/me/profile – update own profile (auth required). Adopter/seller: name, contactNumber, address. Email cannot be changed. */
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};
    if (body.name !== undefined) {
      const name = String(body.name ?? '').trim();
      if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
      updates.name = name;
    }
    if (body.contactNumber !== undefined) {
      const phone = body.contactNumber === null || body.contactNumber === '' ? null : String(body.contactNumber).trim().replace(/\D/g, '').slice(0, 10);
      if (phone !== null && phone.length !== 10) return res.status(400).json({ error: 'Phone must be 10 digits or empty' });
      updates.contactNumber = phone || null;
    }
    if (body.address !== undefined) {
      updates.address = body.address === null || body.address === '' ? null : String(body.address).trim();
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No allowed fields to update (name, contactNumber, address)' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { _id, passwordHash, __v, ...rest } = user;
    return res.json({ id: _id.toString(), ...rest, status: rest.status ?? 'active' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/me/adoption-requests – list adoption requests for the authenticated adopter */
router.get('/adoption-requests', requireAuth, async (req, res) => {
  try {
    const adopterId = String(req.userId);
    const requests = await AdoptionRequest.find({ adopterId }).sort({ createdAt: -1 }).lean();
    const shelterIds = [...new Set(requests.map((r) => r.shelterId))];
    const shelters = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('_id organizationName name')
      .lean();
    const shelterById = Object.fromEntries(
      shelters.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || 'Shelter',
      ])
    );
    const list = requests.map((r) => ({
      id: r._id.toString(),
      petId: r.petId,
      petName: r.petName,
      shelterId: r.shelterId,
      shelterName: shelterById[r.shelterId] ?? 'Shelter',
      status: r.status,
      appliedAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
      updatedAt: r.updatedAt?.toISOString?.() ?? new Date(r.updatedAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/me/adoption-requests/:id/cancel – adopter cancels their own adoption request */
router.post('/adoption-requests/:id/cancel', requireAuth, requireAdopter, async (req, res) => {
  try {
    const adopterId = String(req.userId);
    const { id } = req.params;
    const doc = await AdoptionRequest.findOne({ _id: id, adopterId }).lean();
    if (!doc) return res.status(404).json({ error: 'Adoption request not found' });
    if (['Approved', 'Rejected', 'Cancelled'].includes(doc.status)) {
      return res.status(400).json({
        error: doc.status === 'Cancelled' ? 'This request is already cancelled.' : 'You cannot cancel this request.',
      });
    }
    const updated = await AdoptionRequest.findByIdAndUpdate(
      id,
      { $set: { status: 'Cancelled' } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Adoption request not found' });

    await Notification.create({
      shelterId: doc.shelterId,
      type: 'request',
      title: 'Adoption request cancelled',
      message: `${doc.adopterName} cancelled their adoption request for ${doc.petName}.`,
      link: '/dashboard/shelter/requests',
      read: false,
    });

    notifyAdoptionRequestsChanged(doc.shelterId, id, adopterId);
    notifyNotificationsChanged();

    return res.json({
      id: updated._id.toString(),
      petId: updated.petId,
      petName: updated.petName,
      shelterId: updated.shelterId,
      shelterName: null,
      status: 'Cancelled',
      appliedAt: updated.createdAt?.toISOString?.() ?? new Date(updated.createdAt).toISOString(),
      updatedAt: updated.updatedAt?.toISOString?.() ?? new Date(updated.updatedAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

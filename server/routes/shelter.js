import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { AdoptionRequest } from '../models/AdoptionRequest.js';
import { Event } from '../models/Event.js';
import { FundraisingCampaign } from '../models/FundraisingCampaign.js';
import { Donation } from '../models/Donation.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyNotificationsChanged, notifyPetsChanged, notifyAdoptionRequestsChanged, notifyEventsChanged, notifyFundraisingChanged } from '../socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'shelter');
const PETS_UPLOAD_DIR = path.join(__dirname, '..', 'data', 'pets');
const EVENT_UPLOAD_DIR = path.join(__dirname, '..', 'data', 'event');
const FUNDS_UPLOAD_DIR = path.join(__dirname, '..', 'data', 'funds');

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create shelter upload dir:', e.message);
}
try {
  fs.mkdirSync(PETS_UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create pets upload dir:', e.message);
}
try {
  fs.mkdirSync(EVENT_UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create event upload dir:', e.message);
}
try {
  fs.mkdirSync(FUNDS_UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('Could not create funds upload dir:', e.message);
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

const petStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PETS_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const name = `pet-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

const uploadPet = multer({
  storage: petStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, !!allowed);
  },
});

const eventStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVENT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const name = `event-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

const uploadEventBanner = multer({
  storage: eventStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, !!allowed);
  },
});

const fundsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FUNDS_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const name = `fund-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    cb(null, name);
  },
});

const uploadFundsImage = multer({
  storage: fundsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, !!allowed);
  },
});

const router = express.Router();

/** Require authenticated user to be a shelter */
function requireShelter(req, res, next) {
  if (req.authUser?.role !== 'shelter') {
    return res.status(403).json({ error: 'Shelter access only' });
  }
  next();
}

/** Require shelter to not be blocked (use after requireAuth + requireShelter on mutation routes) */
function requireShelterActive(req, res, next) {
  if (req.authUser?.status === 'blocked') {
    return res.status(403).json({ error: 'Your account has been blocked. You cannot add, edit, or delete content.' });
  }
  next();
}

/** GET /api/shelter/profile – get shelter profile (auth, shelter only). Used for profile form. */
router.get('/profile', requireAuth, requireShelter, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('organizationName description address district contactEmail contactNumberShelter website logoUrl ownerName ownerEmail ownerPhone status updatedAt')
      .lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const verificationStatus = user.status === 'active' ? 'Verified' : 'Pending';
    return res.json({
      organizationName: user.organizationName ?? '',
      description: user.description ?? '',
      address: user.address ?? '',
      district: user.district ?? null,
      contactEmail: user.contactEmail ?? user.email ?? '',
      contactPhone: user.contactNumberShelter ?? '',
      website: user.website ?? '',
      logoUrl: user.logoUrl ?? '',
      ownerName: user.ownerName ?? null,
      ownerEmail: user.ownerEmail ?? null,
      ownerPhone: user.ownerPhone ?? null,
      verificationStatus,
      updatedAt: user.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/shelter/profile – update shelter profile (auth, shelter only). */
router.patch('/profile', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};
    const str = (v) => (v === null || v === undefined ? null : String(v).trim() || null);
    if (body.organizationName !== undefined) updates.organizationName = str(body.organizationName) ?? '';
    if (body.description !== undefined) updates.description = str(body.description);
    if (body.address !== undefined) updates.address = str(body.address) ?? '';
    if (body.district !== undefined) updates.district = str(body.district);
    if (body.contactEmail !== undefined) updates.contactEmail = str(body.contactEmail) ?? '';
    if (body.contactPhone !== undefined) updates.contactNumberShelter = str(body.contactPhone) ?? '';
    if (body.website !== undefined) updates.website = str(body.website) ?? '';
    if (body.logoUrl !== undefined) updates.logoUrl = str(body.logoUrl) ?? '';
    if (body.ownerName !== undefined) updates.ownerName = str(body.ownerName);
    if (body.ownerEmail !== undefined) updates.ownerEmail = str(body.ownerEmail);
    if (body.ownerPhone !== undefined) updates.ownerPhone = str(body.ownerPhone);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No allowed fields to update' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('organizationName description address district contactEmail contactNumberShelter website logoUrl ownerName ownerEmail ownerPhone status updatedAt')
      .lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const verificationStatus = user.status === 'active' ? 'Verified' : 'Pending';
    return res.json({
      organizationName: user.organizationName ?? '',
      description: user.description ?? '',
      address: user.address ?? '',
      district: user.district ?? null,
      contactEmail: user.contactEmail ?? '',
      contactPhone: user.contactNumberShelter ?? '',
      website: user.website ?? '',
      logoUrl: user.logoUrl ?? '',
      ownerName: user.ownerName ?? null,
      ownerEmail: user.ownerEmail ?? null,
      ownerPhone: user.ownerPhone ?? null,
      verificationStatus,
      updatedAt: user.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/notifications – list notifications for the authenticated shelter, newest first */
router.get('/notifications', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 100);
    const notifications = await Notification.find({ shelterId })
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

/** PATCH /api/shelter/notifications/:id/read – mark one notification as read */
router.patch('/notifications/:id/read', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const doc = await Notification.findOne({ _id: id, shelterId });
    if (!doc) return res.status(404).json({ error: 'Notification not found' });
    await Notification.findByIdAndUpdate(id, { $set: { read: true } });
    notifyNotificationsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/shelter/notifications/read-all – mark all notifications as read for the shelter */
router.post('/notifications/read-all', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    await Notification.updateMany({ shelterId }, { $set: { read: true } });
    notifyNotificationsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/requests – list adoption requests for the authenticated shelter (with adopter contact + pet details) */
router.get('/requests', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const requests = await AdoptionRequest.find({ shelterId }).sort({ createdAt: -1 }).lean();
    const adopterIds = [...new Set(requests.map((r) => r.adopterId))];
    const petIds = [...new Set(requests.map((r) => r.petId))];
    const [adopters, pets] = await Promise.all([
      User.find({ _id: { $in: adopterIds } })
        .select('_id contactNumber')
        .lean(),
      Pet.find({ _id: { $in: petIds }, shelterId }).select('name species breed age gender image description adoptionStatus').lean(),
    ]);
    const adopterById = Object.fromEntries(
      adopters.map((u) => [u._id.toString(), { contactNumber: u.contactNumber || null }])
    );
    const petById = Object.fromEntries(
      pets.map((p) => [
        p._id.toString(),
        {
          name: p.name,
          species: p.species,
          breed: p.breed,
          age: p.age,
          gender: p.gender,
          image: p.image || '',
          description: p.description || '',
          adoptionStatus: p.adoptionStatus || 'Available',
        },
      ])
    );
    const withId = requests.map((r) => {
      const adopter = adopterById[r.adopterId];
      const pet = petById[r.petId];
      return {
        id: r._id.toString(),
        adopterName: r.adopterName,
        adopterEmail: r.adopterEmail,
        adopterPhone: adopter?.contactNumber ?? null,
        adopterAddress: r.adopterAddress ?? null,
        petId: r.petId,
        petName: r.petName,
        petImage: pet?.image ?? null,
        petSpecies: pet?.species ?? null,
        petBreed: pet?.breed ?? null,
        petAge: pet?.age ?? null,
        petGender: pet?.gender ?? null,
        petDescription: pet?.description ?? null,
        petAdoptionStatus: pet?.adoptionStatus ?? null,
        status: r.status,
        compatibilityScore: r.compatibilityScore ?? null,
        aiReasons: r.aiReasons || [],
        message: r.message ?? '',
        appliedAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
        updatedAt: r.updatedAt?.toISOString?.() ?? new Date(r.updatedAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/shelter/requests/:id – update adoption request status (shelter only). One pet can only have one approved adopter. */
router.patch('/requests/:id', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['New', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    const existing = await AdoptionRequest.findOne({ _id: id, shelterId }).lean();
    if (!existing) return res.status(404).json({ error: 'Request not found' });
    if (status === 'Approved') {
      const alreadyApproved = await AdoptionRequest.findOne({
        petId: existing.petId,
        status: 'Approved',
        _id: { $ne: id },
      }).lean();
      if (alreadyApproved) {
        return res.status(400).json({ error: 'This pet already has an approved adopter.' });
      }
    }
    const doc = await AdoptionRequest.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Request not found' });
    if (status === 'Approved') {
      const others = await AdoptionRequest.find({
        petId: doc.petId,
        _id: { $ne: doc._id },
        status: { $ne: 'Rejected' },
      }).lean();
      if (others.length > 0) {
        await AdoptionRequest.updateMany(
          { petId: doc.petId, _id: { $ne: doc._id } },
          { $set: { status: 'Rejected' } }
        );
        for (const o of others) {
          notifyAdoptionRequestsChanged(shelterId, o._id.toString(), o.adopterId?.toString());
        }
      }
    }
    const adopter = await User.findById(doc.adopterId).select('contactNumber').lean();
    notifyAdoptionRequestsChanged(shelterId, doc._id.toString(), doc.adopterId?.toString());
    const withId = {
      id: doc._id.toString(),
      adopterName: doc.adopterName,
      adopterEmail: doc.adopterEmail,
      adopterPhone: adopter?.contactNumber ?? null,
      adopterAddress: doc.adopterAddress ?? null,
      petId: doc.petId,
      petName: doc.petName,
      status: doc.status,
      compatibilityScore: doc.compatibilityScore ?? null,
      aiReasons: doc.aiReasons || [],
      message: doc.message ?? '',
      appliedAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() ?? new Date(doc.updatedAt).toISOString(),
    };
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/shelter/logo – upload shelter logo (auth required). Saves to data/shelter, updates User.logoUrl in DB. */
router.post('/logo', requireAuth, requireShelter, requireShelterActive, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }
    const userId = String(req.userId);
    const relativePath = `/api/shelter/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(userId, { $set: { logoUrl: relativePath } });
    return res.json({ url: relativePath });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/shelter/pets/upload – upload pet image. Saves to data/pets, returns path to store in DB. */
router.post('/pets/upload', requireAuth, requireShelter, requireShelterActive, uploadPet.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const pathToStore = `/api/pets/uploads/${req.file.filename}`;
    return res.json({ path: pathToStore });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/pets – list all pets for the authenticated shelter */
router.get('/pets', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const pets = await Pet.find({ shelterId }).sort({ updatedAt: -1 }).lean();
    const withId = pets.map((p) => {
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

/** POST /api/shelter/pets – create a pet for the authenticated shelter */
router.post('/pets', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const body = req.body || {};
    const doc = {
      shelterId,
      name: String(body.name ?? '').trim(),
      species: body.species === 'dog' || body.species === 'cat' ? body.species : 'dog',
      breed: String(body.breed ?? '').trim(),
      age: Number(body.age) ?? 0,
      gender: body.gender === 'male' || body.gender === 'female' || body.gender === 'unknown' ? body.gender : 'unknown',
      image: String(body.image ?? '').trim(),
      photos: Array.isArray(body.photos) ? body.photos.map((u) => String(u).trim()).filter(Boolean) : [],
      badges: Array.isArray(body.badges) ? body.badges.map((b) => String(b).trim()).filter(Boolean) : [],
      status: body.status === 'available' || body.status === 'pending' || body.status === 'adopted' ? body.status : 'available',
      adoptionStatus: body.adoptionStatus === 'Available' || body.adoptionStatus === 'Reserved' || body.adoptionStatus === 'Adopted' ? body.adoptionStatus : 'Available',
      temperament: String(body.temperament ?? '').trim(),
      vaccinationStatus: body.vaccinationStatus ?? 'unknown',
      medicalNotes: String(body.medicalNotes ?? '').trim(),
      specialCareNeeds: String(body.specialCareNeeds ?? '').trim(),
      livingSpace: body.livingSpace ?? 'house-with-yard',
      energyLevel: body.energyLevel ?? 'medium',
      experience: body.experience ?? 'some',
      kids: body.kids ?? 'older',
      specialCare: body.specialCare ?? 'none',
      size: body.size === 'small' || body.size === 'medium' || body.size === 'large' ? body.size : 'medium',
      weight: body.weight != null && body.weight !== '' ? Number(body.weight) : null,
      height: body.height != null && body.height !== '' ? Number(body.height) : null,
      description: String(body.description ?? '').trim(),
      archived: !!body.archived,
    };
    if (!doc.name || !doc.breed) {
      return res.status(400).json({ error: 'Name and breed are required' });
    }
    const pet = await Pet.create(doc);
    const json = pet.toJSON();
    notifyPetsChanged();
    res.status(201).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/pets/:id – get one pet (must belong to shelter) */
router.get('/pets/:id', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const pet = await Pet.findOne({ _id: id, shelterId }).lean();
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    const { _id, ...rest } = pet;
    res.json({
      ...rest,
      id: _id.toString(),
      createdAt: pet.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
      updatedAt: pet.updatedAt?.toISOString?.() ?? new Date(p.updatedAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/shelter/pets/:id – update pet (must belong to shelter) */
router.patch('/pets/:id', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const body = req.body || {};
    const allowed = [
      'name', 'species', 'breed', 'age', 'gender', 'image', 'photos', 'badges',
      'status', 'adoptionStatus', 'temperament', 'vaccinationStatus', 'medicalNotes', 'specialCareNeeds',
      'livingSpace', 'energyLevel', 'experience', 'kids', 'specialCare', 'size', 'weight', 'height', 'description', 'archived',
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] === undefined) continue;
      if (key === 'photos' || key === 'badges') {
        updates[key] = Array.isArray(body[key]) ? body[key].map((x) => String(x).trim()).filter(Boolean) : [];
      } else if (key === 'age') {
        updates[key] = Number(body[key]) ?? 0;
      } else if (key === 'weight' || key === 'height') {
        const v = body[key];
        updates[key] = v != null && v !== '' ? Number(v) : null;
      } else if (key === 'archived') {
        updates[key] = !!body[key];
      } else if (typeof body[key] === 'string') {
        updates[key] = body[key].trim();
      } else {
        updates[key] = body[key];
      }
    }
    const pet = await Pet.findOneAndUpdate(
      { _id: id, shelterId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    notifyPetsChanged();
    const { _id, ...rest } = pet;
    res.json({
      ...rest,
      id: _id.toString(),
      createdAt: pet.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
      updatedAt: pet.updatedAt?.toISOString?.() ?? new Date(p.updatedAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/shelter/pets/:id – delete pet (must belong to shelter) */
router.delete('/pets/:id', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const deleted = await Pet.findOneAndDelete({ _id: id, shelterId });
    if (!deleted) return res.status(404).json({ error: 'Pet not found' });
    notifyPetsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/shelter/events/upload – upload event banner. Saves to data/event, returns path. */
router.post('/events/upload', requireAuth, requireShelter, requireShelterActive, uploadEventBanner.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No banner file uploaded' });
    }
    const pathToStore = `/api/shelter/events/uploads/${req.file.filename}`;
    return res.json({ path: pathToStore });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/events – list events for the authenticated shelter */
router.get('/events', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const events = await Event.find({ shelterId }).sort({ date: -1, createdAt: -1 }).lean();
    const withId = events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date,
      time: e.time || undefined,
      location: e.location,
      description: e.description,
      bannerUrl: e.bannerUrl || undefined,
      priceText: e.priceText || undefined,
      blocked: !!e.blocked,
      createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
    }));
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/shelter/events – create event */
router.post('/events', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const body = req.body || {};
    const doc = {
      shelterId,
      title: String(body.title ?? '').trim(),
      date: String(body.date ?? '').trim(),
      time: body.time != null ? String(body.time).trim() : '',
      location: String(body.location ?? '').trim(),
      description: String(body.description ?? '').trim(),
      bannerUrl: String(body.bannerUrl ?? '').trim(),
      priceText: String(body.priceText ?? '').trim(),
    };
    if (!doc.title || !doc.date || !doc.location || !doc.description) {
      return res.status(400).json({ error: 'Title, date, location and description are required' });
    }
    const event = await Event.create(doc);
    notifyEventsChanged();
    res.status(201).json({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      time: event.time || undefined,
      location: event.location,
      description: event.description,
      bannerUrl: event.bannerUrl || undefined,
      priceText: event.priceText || undefined,
      createdAt: event.createdAt?.toISOString?.() ?? new Date(event.createdAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/shelter/events/:id – update event (must belong to shelter) */
router.patch('/events/:id', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};
    const allowed = ['title', 'date', 'time', 'location', 'description', 'bannerUrl', 'priceText'];
    for (const key of allowed) {
      if (body[key] === undefined) continue;
      if (key === 'time') {
        updates[key] = body[key] != null ? String(body[key]).trim() : '';
      } else {
        updates[key] = String(body[key] ?? '').trim();
      }
    }
    const event = await Event.findOneAndUpdate(
      { _id: id, shelterId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    notifyEventsChanged();
    res.json({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      time: event.time || undefined,
      location: event.location,
      description: event.description,
      bannerUrl: event.bannerUrl || undefined,
      priceText: event.priceText || undefined,
      createdAt: event.createdAt?.toISOString?.() ?? new Date(event.createdAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/shelter/events/:id – delete event (must belong to shelter) */
router.delete('/events/:id', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const { id } = req.params;
    const deleted = await Event.findOneAndDelete({ _id: id, shelterId });
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    notifyEventsChanged();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Fundraising campaigns (shelter: create + list only; no edit/delete) ----------

/** POST /api/shelter/campaigns/upload – upload campaign image. Saves to data/funds, returns path. */
router.post('/campaigns/upload', requireAuth, requireShelter, requireShelterActive, uploadFundsImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const pathToStore = `/api/shelter/campaigns/uploads/${req.file.filename}`;
    return res.json({ path: pathToStore });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/donations – list donations for the authenticated shelter (all campaigns), newest first */
router.get('/donations', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const donations = await Donation.find({ shelterId }).sort({ createdAt: -1 }).limit(200).lean();
    const withId = donations.map((d) => ({
      id: d._id.toString(),
      donorName: d.donorName,
      donorEmail: d.donorEmail ?? null,
      donorPhone: d.donorPhone ?? null,
      amount: d.amount,
      campaignId: d.campaignId ? d.campaignId.toString() : null,
      campaignName: d.campaignName ?? null,
      donatedAt: d.createdAt?.toISOString?.() ?? new Date(d.createdAt).toISOString(),
    }));
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/shelter/campaigns – list all campaigns for the authenticated shelter (all statuses) */
router.get('/campaigns', requireAuth, requireShelter, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const campaigns = await FundraisingCampaign.find({ shelterId }).sort({ createdAt: -1 }).lean();
    const campaignIds = campaigns.map((c) => c._id);
    const donationSums = await Donation.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$campaignId', total: { $sum: '$amount' } } },
    ]);
    const raisedByCampaign = Object.fromEntries(donationSums.map((d) => [d._id.toString(), d.total]));
    const withId = campaigns.map((c) => {
      const raised = raisedByCampaign[c._id.toString()] ?? c.raised ?? 0;
      return {
        id: c._id.toString(),
        title: c.title,
        description: c.description || undefined,
        imageUrl: c.imageUrl || undefined,
        goal: c.goal,
        raised,
        endDate: c.endDate,
        status: c.status,
        createdAt: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/shelter/campaigns – create campaign (status: pending; shelter cannot edit/delete) */
router.post('/campaigns', requireAuth, requireShelter, requireShelterActive, async (req, res) => {
  try {
    const shelterId = String(req.userId);
    const body = req.body || {};
    const goal = Number(body.goal);
    if (isNaN(goal) || goal < 1000) {
      return res.status(400).json({ error: 'Goal must be at least 1,000' });
    }
    const doc = {
      shelterId,
      title: String(body.title ?? '').trim(),
      description: String(body.description ?? '').trim(),
      imageUrl: String(body.imageUrl ?? '').trim(),
      goal: Math.round(goal),
      endDate: String(body.endDate ?? '').trim(),
      status: 'pending',
    };
    if (!doc.title || !doc.endDate) {
      return res.status(400).json({ error: 'Title and end date are required' });
    }
    const campaign = await FundraisingCampaign.create(doc);
    notifyFundraisingChanged();
    res.status(201).json({
      id: campaign._id.toString(),
      title: campaign.title,
      description: campaign.description || undefined,
      imageUrl: campaign.imageUrl || undefined,
      goal: campaign.goal,
      raised: 0,
      endDate: campaign.endDate,
      status: campaign.status,
      createdAt: campaign.createdAt?.toISOString?.() ?? new Date(campaign.createdAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

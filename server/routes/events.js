import express from 'express';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';

const router = express.Router();

/** GET /api/events – list all events (public). Excludes blocked events. Optional ?shelterId= for one shelter. Sorted by date desc. */
router.get('/', async (req, res) => {
  try {
    const shelterId = req.query.shelterId ? String(req.query.shelterId).trim() : null;
    const filter = shelterId ? { shelterId, blocked: { $ne: true } } : { blocked: { $ne: true } };
    const events = await Event.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    const visitorId = req.query.visitorId ? String(req.query.visitorId).trim() : null;
    const withId = events.map((e) => {
      const likedBy = e.likedBy || [];
      return {
        id: e._id.toString(),
        shelterId: e.shelterId,
        title: e.title,
        date: e.date,
        time: e.time || undefined,
        location: e.location,
        description: e.description,
        bannerUrl: e.bannerUrl || undefined,
        priceText: e.priceText || undefined,
        likeCount: likedBy.length,
        ...(visitorId != null && visitorId !== '' ? { liked: likedBy.includes(visitorId) } : {}),
        createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
      };
    });
    res.json(withId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/events/:id – get one event by id (public). Blocked events return 404. Optional ?visitorId= for liked state. Includes shelter (organizer) details. */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = req.query.visitorId ? String(req.query.visitorId).trim() : null;
    const e = await Event.findById(id).lean();
    if (!e || e.blocked) return res.status(404).json({ error: 'Event not found' });
    const likedBy = e.likedBy || [];
    const payload = {
      id: e._id.toString(),
      shelterId: e.shelterId,
      title: e.title,
      date: e.date,
      time: e.time || undefined,
      location: e.location,
      description: e.description,
      bannerUrl: e.bannerUrl || undefined,
      priceText: e.priceText || undefined,
      likeCount: likedBy.length,
      createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
    };
    if (visitorId != null && visitorId !== '') payload.liked = likedBy.includes(visitorId);

    const shelterUser = await User.findOne({ _id: e.shelterId, role: 'shelter' })
      .select('name email organizationName address district contactEmail contactNumberShelter description website logoUrl ownerName ownerEmail ownerPhone')
      .lean();
    if (shelterUser) {
      payload.shelter = {
        id: shelterUser._id.toString(),
        name: (shelterUser.organizationName && String(shelterUser.organizationName).trim()) || shelterUser.name || 'Shelter',
        address: shelterUser.address || null,
        district: shelterUser.district || null,
        contactEmail: shelterUser.contactEmail || shelterUser.email || null,
        contactPhone: shelterUser.contactNumberShelter || null,
        description: shelterUser.description || null,
        website: shelterUser.website || null,
        logoUrl: shelterUser.logoUrl || null,
        ownerName: shelterUser.ownerName || null,
        ownerEmail: shelterUser.ownerEmail || null,
        ownerPhone: shelterUser.ownerPhone || null,
      };
    }
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/events/:id/like – toggle like (no auth). Blocked events return 404. Body: { visitorId }. Returns { count, liked }. */
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = req.body?.visitorId != null ? String(req.body.visitorId).trim() : null;
    if (!visitorId) return res.status(400).json({ error: 'visitorId is required' });
    const doc = await Event.findById(id);
    if (!doc || doc.blocked) return res.status(404).json({ error: 'Event not found' });
    const likedBy = doc.likedBy || [];
    if (likedBy.includes(visitorId)) {
      doc.likedBy = likedBy.filter((x) => x !== visitorId);
    } else {
      doc.likedBy = [...likedBy, visitorId];
    }
    await doc.save();
    res.json({ count: doc.likedBy.length, liked: doc.likedBy.includes(visitorId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

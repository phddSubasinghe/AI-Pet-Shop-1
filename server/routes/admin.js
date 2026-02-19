import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Pet } from '../models/Pet.js';
import { Order } from '../models/Order.js';
import { Payout } from '../models/Payout.js';
import { Donation } from '../models/Donation.js';
import { ShelterPayout } from '../models/ShelterPayout.js';
import { Notification } from '../models/Notification.js';
import { AdoptionRequest } from '../models/AdoptionRequest.js';
import { notifyUserStatusChanged, notifyPasswordReset, notifyUserDeleted, notifyNotificationsChanged, notifyPetsChanged, notifyAdoptionRequestsChanged, notifyEventsChanged, notifyFundraisingChanged, notifyFundraisingApproved } from '../socket.js';
import { Event } from '../models/Event.js';
import { FundraisingCampaign } from '../models/FundraisingCampaign.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// ---------- Admin overview (dashboard stats + recent activity) ----------

/** GET /api/admin/overview – aggregated stats and recent activity for admin dashboard */
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalAdopters,
      totalShelters,
      totalSellers,
      activeShelters,
      activeSellers,
      pendingShelters,
      pendingSellers,
      activePetsListed,
      pendingCampaigns,
      donationsThisMonthAgg,
      donationsAllTimeAgg,
      recentDonations,
      recentAdoptionRequests,
      recentPets,
      recentCampaigns,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'adopter' }),
      User.countDocuments({ role: 'shelter' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'shelter', status: 'active' }),
      User.countDocuments({ role: 'seller', status: 'active' }),
      User.countDocuments({ role: 'shelter', status: 'pending' }),
      User.countDocuments({ role: 'seller', status: 'pending' }),
      Pet.countDocuments({ archived: { $ne: true }, status: 'available' }),
      FundraisingCampaign.countDocuments({ status: 'pending' }),
      Donation.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Donation.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Donation.find().sort({ createdAt: -1 }).limit(5).lean(),
      AdoptionRequest.find().sort({ createdAt: -1 }).limit(5).lean(),
      Pet.find().sort({ createdAt: -1 }).limit(5).lean(),
      FundraisingCampaign.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
    ]);

    const donationsThisMonth = donationsThisMonthAgg[0]?.total ?? 0;
    const totalDonationsAllTime = donationsAllTimeAgg[0]?.total ?? 0;
    const pendingApprovals = pendingShelters + pendingSellers + pendingCampaigns;

    const shelterIds = [...new Set([
      ...recentDonations.map((d) => d.shelterId),
      ...recentAdoptionRequests.map((r) => r.shelterId),
      ...recentPets.map((p) => p.shelterId),
      ...recentCampaigns.map((c) => c.shelterId),
    ])];
    const shelters = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name organizationName')
      .lean();
    const shelterById = Object.fromEntries(
      shelters.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
      ])
    );

    const activityItems = [];
    for (const d of recentDonations) {
      activityItems.push({
        id: `donation-${d._id}`,
        type: 'donation',
        title: 'Donation received',
        description: `${d.donorName} donated LKR ${Number(d.amount).toLocaleString('en-LK')}${d.campaignName ? ` to ${d.campaignName}` : ''}.`,
        at: d.createdAt?.toISOString?.() ?? new Date(d.createdAt).toISOString(),
        meta: { amount: String(d.amount), shelterName: shelterById[d.shelterId] ?? '—' },
      });
    }
    for (const r of recentAdoptionRequests) {
      activityItems.push({
        id: `request-${r._id}`,
        type: 'new_request',
        title: 'Adoption request',
        description: `${r.adopterName} requested to adopt ${r.petName} from ${shelterById[r.shelterId] ?? '—'}.`,
        at: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
        meta: { adopterName: r.adopterName, petName: r.petName },
      });
    }
    for (const p of recentPets) {
      activityItems.push({
        id: `pet-${p._id}`,
        type: 'new_listing',
        title: 'New pet listed',
        description: `${p.name} (${String(p.species).charAt(0).toUpperCase() + String(p.species).slice(1)}) listed by ${shelterById[p.shelterId] ?? '—'}.`,
        at: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
        meta: { petName: p.name },
      });
    }
    for (const c of recentCampaigns) {
      if (c.status === 'pending') {
        activityItems.push({
          id: `campaign-${c._id}`,
          type: 'approval',
          title: 'Campaign pending approval',
          description: `"${c.title}" by ${shelterById[c.shelterId] ?? '—'} is awaiting review.`,
          at: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
          meta: { title: c.title },
        });
      }
    }
    for (const u of recentUsers) {
      if (u.role !== 'admin') {
        activityItems.push({
          id: `user-${u._id}`,
          type: 'user',
          title: 'New user signup',
          description: `${u.name} signed up as ${u.role}.`,
          at: u.createdAt?.toISOString?.() ?? new Date(u.createdAt).toISOString(),
          meta: { userName: u.name },
        });
      }
    }
    activityItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const recentActivity = activityItems.slice(0, 3);

    return res.json({
      stats: {
        totalUsers,
        totalAdopters,
        totalShelters,
        totalSellers,
        verifiedShelters: activeShelters,
        verifiedSellers: activeSellers,
        pendingShelters,
        pendingSellers,
        pendingApprovals,
        pendingFundraisingCampaigns: pendingCampaigns,
        activePetsListed,
        donationsThisMonth,
        totalDonationsAllTime,
      },
      recentActivity,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Admin analytics (charts and insights) ----------

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toAdminStatus(s) {
  return s === 'New' ? 'Requested' : s;
}

/** GET /api/admin/analytics – aggregated analytics for charts and insights. Query: startDate, endDate (YYYY-MM-DD). */
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    if (req.query.startDate && req.query.endDate) {
      const s = new Date(String(req.query.startDate));
      const e = new Date(String(req.query.endDate));
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        startDate = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
        endDate = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
        if (endDate < startDate) endDate = startDate;
      }
    }
    const dateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

    const [
      donationsByMonthAgg,
      adoptionRequestsByStatusAgg,
      approvedRequestPetIds,
      compatibilityScores,
      totalUsers,
      activeShelters,
      activeSellers,
      activePetsListed,
    ] = await Promise.all([
      Donation.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      AdoptionRequest.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AdoptionRequest.find({ createdAt: { $gte: startDate, $lte: endDate }, status: 'Approved' }).select('petId').lean(),
      AdoptionRequest.find({ createdAt: { $gte: startDate, $lte: endDate }, compatibilityScore: { $ne: null, $gte: 0 } }).select('compatibilityScore').lean(),
      User.countDocuments(),
      User.countDocuments({ role: 'shelter', status: 'active' }),
      User.countDocuments({ role: 'seller', status: 'active' }),
      Pet.countDocuments({ archived: { $ne: true }, status: 'available' }),
    ]);

    const donationsByMonthMap = new Map(
      donationsByMonthAgg.map((d) => [`${d._id.year}-${String(d._id.month).padStart(2, '0')}`, d.amount])
    );
    const donationsByMonth = [];
    const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const totalMonths = (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 + (rangeEnd.getMonth() - rangeStart.getMonth()) + 1;
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      donationsByMonth.push({ month: monthLabel, amount: donationsByMonthMap.get(key) ?? 0 });
    }
    if (donationsByMonth.length === 0) {
      donationsByMonth.push({ month: `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`, amount: 0 });
    }

    const statusOrder = ['New', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected', 'Cancelled'];
    const statusCounts = Object.fromEntries(adoptionRequestsByStatusAgg.map((s) => [s._id, s.count]));
    const adoptionRequestsByStatus = statusOrder.map((status) => ({
      status: toAdminStatus(status),
      count: statusCounts[status] ?? 0,
    }));

    let topAdoptedPetTypes = [];
    if (approvedRequestPetIds.length > 0) {
      const petIds = approvedRequestPetIds.map((r) => r.petId).filter(Boolean);
      const pets = await Pet.find({ _id: { $in: petIds } }).select('species').lean();
      const bySpecies = {};
      for (const p of pets) {
        const s = p.species ? String(p.species).charAt(0).toUpperCase() + String(p.species).slice(1) : 'Unknown';
        bySpecies[s] = (bySpecies[s] || 0) + 1;
      }
      topAdoptedPetTypes = Object.entries(bySpecies)
        .map(([species, count]) => ({ species, count }))
        .sort((a, b) => b.count - a.count);
    }

    const scores = compatibilityScores.map((r) => Number(r.compatibilityScore)).filter((n) => !isNaN(n));
    const averageAiCompatibilityScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

    return res.json({
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      donationsByMonth,
      adoptionRequestsByStatus,
      topAdoptedPetTypes,
      averageAiCompatibilityScore,
      totalUsers,
      verifiedShelters: activeShelters,
      verifiedSellers: activeSellers,
      activePetsListed,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Seller payouts (admin payment management) ----------

/** GET /api/admin/payments/seller-payouts – list all seller payouts with seller info */
router.get('/payments/seller-payouts', async (req, res) => {
  try {
    const status = req.query.status; // optional: pending | paid
    const query = status && ['pending', 'paid'].includes(status) ? { status } : {};
    const payouts = await Payout.find(query).sort({ createdAt: -1 }).lean();
    const sellerIds = [...new Set(payouts.map((p) => p.sellerId))];
    const users = await User.find({ _id: { $in: sellerIds } }).select('name email').lean();
    const userById = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
    const list = payouts.map((p) => ({
      id: p._id.toString(),
      sellerId: p.sellerId,
      sellerName: userById[p.sellerId]?.name ?? '—',
      sellerEmail: userById[p.sellerId]?.email ?? '—',
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/payments/seller-pending – list sellers with pending balance (delivered earnings not yet paid) */
router.get('/payments/seller-pending', async (req, res) => {
  try {
    const delivered = await Order.find({ status: 'Delivered' }).lean();
    const bySeller = {};
    for (const order of delivered) {
      for (const item of order.items || []) {
        const sid = item.sellerId;
        if (!sid) continue;
        bySeller[sid] = (bySeller[sid] || 0) + (Number(item.total) || 0);
      }
    }
    const paid = await Payout.find({ status: 'paid' }).lean();
    for (const p of paid) {
      const sid = p.sellerId;
      bySeller[sid] = (bySeller[sid] || 0) - (Number(p.amount) || 0);
    }
    const sellerIds = Object.keys(bySeller).filter((sid) => bySeller[sid] > 0);
    if (sellerIds.length === 0) return res.json([]);
    const users = await User.find({ _id: { $in: sellerIds }, role: 'seller' })
      .select('name email')
      .lean();
    const list = users.map((u) => {
      const id = u._id.toString();
      return {
        sellerId: id,
        sellerName: u.name,
        sellerEmail: u.email,
        pendingAmount: Math.round(bySeller[id] || 0),
      };
    });
    list.sort((a, b) => b.pendingAmount - a.pendingAmount);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/admin/payments/seller-payouts – create a payout for a seller */
router.post('/payments/seller-payouts', async (req, res) => {
  try {
    const { sellerId, amount } = req.body || {};
    if (!sellerId || amount == null) {
      return res.status(400).json({ error: 'sellerId and amount are required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const user = await User.findById(sellerId).lean();
    if (!user || user.role !== 'seller') {
      return res.status(400).json({ error: 'Seller not found' });
    }
    const doc = await Payout.create({
      sellerId: String(sellerId),
      amount: Math.round(numAmount),
      status: 'pending',
    });
    const amountStr = String(Math.round(numAmount));
    await Notification.create({
      sellerId: String(sellerId),
      type: 'payout',
      title: 'Payout created',
      message: `A payout of LKR ${amountStr} has been created and is pending.`,
      link: '/dashboard/seller/earnings',
      read: false,
    });
    notifyNotificationsChanged();
    return res.status(201).json({
      id: doc._id.toString(),
      sellerId: doc.sellerId,
      sellerName: user.name,
      sellerEmail: user.email,
      amount: doc.amount,
      status: doc.status,
      paidAt: null,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/payments/seller-payouts/:id – mark seller payout as paid */
router.patch('/payments/seller-payouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Payout.findById(id);
    if (!doc) return res.status(404).json({ error: 'Payout not found' });
    if (doc.status === 'paid') {
      return res.status(400).json({ error: 'Payout already marked as paid' });
    }
    doc.status = 'paid';
    doc.paidAt = new Date();
    await doc.save();
    const amountStr = String(doc.amount);
    await Notification.create({
      sellerId: doc.sellerId,
      type: 'payout',
      title: 'Payout processed',
      message: `Your payout of LKR ${amountStr} has been marked as paid.`,
      link: '/dashboard/seller/earnings',
      read: false,
    });
    notifyNotificationsChanged();
    const user = await User.findById(doc.sellerId).select('name email').lean();
    return res.json({
      id: doc._id.toString(),
      sellerId: doc.sellerId,
      sellerName: user?.name ?? '—',
      sellerEmail: user?.email ?? '—',
      amount: doc.amount,
      status: doc.status,
      paidAt: doc.paidAt.toISOString(),
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Shelter payouts (admin payment management) ----------

/** GET /api/admin/payments/shelter-payouts – list all shelter payouts with shelter info */
router.get('/payments/shelter-payouts', async (req, res) => {
  try {
    const status = req.query.status;
    const query = status && ['pending', 'paid'].includes(status) ? { status } : {};
    const payouts = await ShelterPayout.find(query).sort({ createdAt: -1 }).lean();
    const shelterIds = [...new Set(payouts.map((p) => p.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name organizationName email')
      .lean();
    const userById = Object.fromEntries(
      users.map((u) => [u._id.toString(), { name: u.organizationName || u.name, email: u.email }])
    );
    const list = payouts.map((p) => ({
      id: p._id.toString(),
      shelterId: p.shelterId,
      shelterName: userById[p.shelterId]?.name ?? '—',
      shelterEmail: userById[p.shelterId]?.email ?? '—',
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/payments/shelter-pending – list shelters with pending balance (donations not yet paid out) */
router.get('/payments/shelter-pending', async (req, res) => {
  try {
    const donations = await Donation.find({}).lean();
    const byShelter = {};
    for (const d of donations) {
      byShelter[d.shelterId] = (byShelter[d.shelterId] || 0) + (Number(d.amount) || 0);
    }
    const payouts = await ShelterPayout.find({ status: 'paid' }).lean();
    for (const p of payouts) {
      byShelter[p.shelterId] = (byShelter[p.shelterId] || 0) - (Number(p.amount) || 0);
    }
    const shelterIds = Object.keys(byShelter).filter((sid) => byShelter[sid] > 0);
    if (shelterIds.length === 0) return res.json([]);
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name organizationName email')
      .lean();
    const list = users.map((u) => {
      const id = u._id.toString();
      return {
        shelterId: id,
        shelterName: u.organizationName || u.name,
        shelterEmail: u.email,
        pendingAmount: Math.round(byShelter[id] || 0),
      };
    });
    list.sort((a, b) => b.pendingAmount - a.pendingAmount);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/admin/payments/shelter-payouts – create a payout for a shelter */
router.post('/payments/shelter-payouts', async (req, res) => {
  try {
    const { shelterId, amount } = req.body || {};
    if (!shelterId || amount == null) {
      return res.status(400).json({ error: 'shelterId and amount are required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const user = await User.findById(shelterId).lean();
    if (!user || user.role !== 'shelter') {
      return res.status(400).json({ error: 'Shelter not found' });
    }
    const doc = await ShelterPayout.create({
      shelterId: String(shelterId),
      amount: Math.round(numAmount),
      status: 'pending',
    });
    const amountStr = String(Math.round(numAmount));
    await Notification.create({
      shelterId: String(shelterId),
      type: 'payout',
      title: 'Payout created',
      message: `A payout of LKR ${amountStr} has been created and is pending.`,
      link: '/dashboard/shelter/fundraising',
      read: false,
    });
    notifyNotificationsChanged();
    return res.status(201).json({
      id: doc._id.toString(),
      shelterId: doc.shelterId,
      shelterName: user.organizationName || user.name,
      shelterEmail: user.email,
      amount: doc.amount,
      status: doc.status,
      paidAt: null,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/payments/shelter-payouts/:id – mark shelter payout as paid */
router.patch('/payments/shelter-payouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ShelterPayout.findById(id);
    if (!doc) return res.status(404).json({ error: 'Payout not found' });
    if (doc.status === 'paid') {
      return res.status(400).json({ error: 'Payout already marked as paid' });
    }
    doc.status = 'paid';
    doc.paidAt = new Date();
    await doc.save();
    const amountStr = String(doc.amount);
    await Notification.create({
      shelterId: doc.shelterId,
      type: 'payout',
      title: 'Payout processed',
      message: `Your payout of LKR ${amountStr} has been marked as paid.`,
      link: '/dashboard/shelter/fundraising',
      read: false,
    });
    notifyNotificationsChanged();
    const user = await User.findById(doc.shelterId).select('name organizationName email').lean();
    return res.json({
      id: doc._id.toString(),
      shelterId: doc.shelterId,
      shelterName: user?.organizationName || user?.name || '—',
      shelterEmail: user?.email ?? '—',
      amount: doc.amount,
      status: doc.status,
      paidAt: doc.paidAt.toISOString(),
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/admin/donations – record a donation to a shelter (for admin / manual entry) */
router.post('/donations', async (req, res) => {
  try {
    const { donorName, donorEmail, donorPhone, amount, shelterId, campaignName, type } = req.body || {};
    if (!donorName || typeof donorName !== 'string' || !donorName.trim()) {
      return res.status(400).json({ error: 'donorName is required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (!shelterId) return res.status(400).json({ error: 'shelterId is required' });
    const user = await User.findById(shelterId).lean();
    if (!user || user.role !== 'shelter') {
      return res.status(400).json({ error: 'Shelter not found' });
    }
    const doc = await Donation.create({
      donorName: String(donorName).trim(),
      donorEmail: donorEmail != null ? String(donorEmail).trim() : null,
      donorPhone: donorPhone != null ? String(donorPhone).trim() : null,
      amount: Math.round(numAmount),
      shelterId: String(shelterId),
      campaignName: campaignName != null ? String(campaignName).trim() : null,
      type: type === 'recurring' ? 'recurring' : 'one-time',
    });
    return res.status(201).json({
      id: doc._id.toString(),
      donorName: doc.donorName,
      donorEmail: doc.donorEmail ?? null,
      amount: doc.amount,
      shelterId: doc.shelterId,
      campaignName: doc.campaignName ?? null,
      type: doc.type,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/donations – list all donations with shelter and campaign info */
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).lean();
    const shelterIds = [...new Set(donations.map((d) => d.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('organizationName name')
      .lean();
    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
      ])
    );
    const list = donations.map((d) => ({
      id: d._id.toString(),
      donorName: d.donorName,
      donorEmail: d.donorEmail ?? null,
      donorPhone: d.donorPhone ?? null,
      amount: d.amount,
      type: d.type || 'one-time',
      shelterId: d.shelterId,
      shelterName: shelterById[d.shelterId] ?? '—',
      campaignId: d.campaignId ? d.campaignId.toString() : null,
      campaignName: d.campaignName ?? null,
      date: d.createdAt?.toISOString?.() ?? new Date(d.createdAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/pets – list all pets with shelter details (for admin dashboard) */
router.get('/pets', async (req, res) => {
  try {
    const pets = await Pet.find().sort({ updatedAt: -1 }).lean();
    const shelterIds = [...new Set(pets.map((p) => p.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name email organizationName address contactNumberShelter')
      .lean();
    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        {
          shelterName: u.organizationName || u.name || '—',
          shelterEmail: u.email || '—',
          shelterAddress: u.address || null,
          shelterPhone: u.contactNumberShelter || null,
        },
      ])
    );
    const list = pets.map((p) => {
      const shelter = shelterById[p.shelterId] || { shelterName: '—', shelterEmail: '—', shelterAddress: null, shelterPhone: null };
      const ageNum = Number(p.age) ?? 0;
      const ageStr = ageNum < 1 ? `${Math.round(ageNum * 12)} months` : `${ageNum} year${ageNum !== 1 ? 's' : ''}`;
      const images = [p.image, ...(p.photos || [])].filter(Boolean);
      const vaccinated = p.vaccinationStatus === 'up-to-date' || p.vaccinationStatus === 'partial';
      const adoptionStatusLower = (p.adoptionStatus || p.status || 'available').toLowerCase();
      const adoptionStatus = adoptionStatusLower === 'reserved' ? 'reserved' : adoptionStatusLower === 'adopted' ? 'adopted' : 'available';
      return {
        id: p._id.toString(),
        name: p.name,
        species: p.species.charAt(0).toUpperCase() + p.species.slice(1),
        breed: p.breed || null,
        age: ageStr,
        gender: p.gender || null,
        weight: p.weight != null ? Number(p.weight) : null,
        height: p.height != null ? Number(p.height) : null,
        shelterId: p.shelterId,
        shelterName: shelter.shelterName,
        shelterEmail: shelter.shelterEmail,
        shelterAddress: shelter.shelterAddress,
        shelterPhone: shelter.shelterPhone,
        status: p.status || 'available',
        adoptionStatus,
        flagged: false,
        vaccinated,
        vaccinationStatus: p.vaccinationStatus || 'unknown',
        temperament: p.temperament || null,
        medicalNotes: p.medicalNotes || null,
        specialCareNeeds: p.specialCareNeeds || null,
        specialCareNotes: p.medicalNotes || p.specialCareNeeds || null,
        description: p.description || null,
        livingSpace: p.livingSpace || null,
        energyLevel: p.energyLevel || null,
        experience: p.experience || null,
        kids: p.kids || null,
        specialCare: p.specialCare || null,
        size: p.size || null,
        badges: Array.isArray(p.badges) ? p.badges : [],
        images,
        listedAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
        updatedAt: p.updatedAt?.toISOString?.() ?? new Date(p.updatedAt).toISOString(),
      };
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/pets/:id – delete pet (admin). Emits pets:changed for real-time updates. */
router.delete('/pets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Pet.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Pet not found' });
    notifyPetsChanged();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Map backend adoption request status to admin UI (New → Requested) */
function toAdminAdoptionStatus(s) {
  return s === 'New' ? 'Requested' : s;
}

/** GET /api/admin/adoption-requests – list all adoption requests with shelter, pet, and adopter contact info */
router.get('/adoption-requests', async (req, res) => {
  try {
    const requests = await AdoptionRequest.find().sort({ createdAt: -1 }).lean();
    const shelterIds = [...new Set(requests.map((r) => r.shelterId))];
    const petIds = [...new Set(requests.map((r) => r.petId))];
    const adopterIds = [...new Set(requests.map((r) => r.adopterId))];
    const [shelters, pets, adopters] = await Promise.all([
      User.find({ _id: { $in: shelterIds }, role: 'shelter' })
        .select('_id organizationName name')
        .lean(),
      Pet.find({ _id: { $in: petIds } }).select('_id species').lean(),
      User.find({ _id: { $in: adopterIds } }).select('_id contactNumber').lean(),
    ]);
    const shelterById = Object.fromEntries(
      shelters.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
      ])
    );
    const petById = Object.fromEntries(
      pets.map((p) => [p._id.toString(), (p.species && String(p.species).charAt(0).toUpperCase() + String(p.species).slice(1)) || '—'])
    );
    const adopterById = Object.fromEntries(
      adopters.map((u) => [u._id.toString(), { contactNumber: u.contactNumber || null }])
    );
    const list = requests.map((r) => {
      const adopter = adopterById[r.adopterId];
      return {
        id: r._id.toString(),
        adopterId: r.adopterId,
        adopterName: r.adopterName,
        adopterEmail: r.adopterEmail,
        adopterPhone: adopter?.contactNumber ?? null,
        adopterAddress: (r.adopterAddress && String(r.adopterAddress).trim()) || null,
        shelterId: r.shelterId,
        shelterName: shelterById[r.shelterId] ?? '—',
        petId: r.petId,
        petName: r.petName,
        petSpecies: petById[r.petId] ?? '—',
        aiCompatibilityScore: r.compatibilityScore ?? 0,
        submittedAt: r.createdAt?.toISOString?.() ?? new Date(r.createdAt).toISOString(),
        status: toAdminAdoptionStatus(r.status),
        aiReasons: r.aiReasons || [],
        escalated: !!r.escalated,
        escalatedAt: r.escalatedAt?.toISOString?.() ?? null,
      };
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** Map admin UI status back to backend (Requested → New) */
function fromAdminAdoptionStatus(s) {
  return s === 'Requested' ? 'New' : s;
}

/** POST /api/admin/adoption-requests/:id/escalate – mark request as escalated for attention */
router.post('/adoption-requests/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await AdoptionRequest.findByIdAndUpdate(
      id,
      { $set: { escalated: true, escalatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Adoption request not found' });
    notifyAdoptionRequestsChanged(doc.shelterId, doc._id.toString(), doc.adopterId?.toString());
    return res.json({
      id: doc._id.toString(),
      escalated: true,
      escalatedAt: doc.escalatedAt?.toISOString?.() ?? new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/adoption-requests/:id – update adoption request status. One pet can only have one approved adopter. */
router.patch('/adoption-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['New', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected'];
    const backendStatus = status === 'Requested' ? 'New' : status;
    if (!backendStatus || !allowed.includes(backendStatus)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    const existing = await AdoptionRequest.findById(id).lean();
    if (!existing) return res.status(404).json({ error: 'Adoption request not found' });
    if (backendStatus === 'Approved') {
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
      { $set: { status: backendStatus } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Adoption request not found' });
    if (backendStatus === 'Approved') {
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
          notifyAdoptionRequestsChanged(o.shelterId, o._id.toString(), o.adopterId?.toString());
        }
      }
    }
    notifyAdoptionRequestsChanged(doc.shelterId, doc._id.toString(), doc.adopterId?.toString());
    return res.json({
      id: doc._id.toString(),
      status: toAdminAdoptionStatus(doc.status),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/users – list all users (for admin dashboard) */
router.get('/users', async (req, res) => {
  try {
    const list = await User.find()
      .sort({ createdAt: -1 })
      .lean();
    const users = list.map((u) => {
      const { _id, passwordHash, __v, ...rest } = u;
      return {
        id: _id.toString(),
        ...rest,
        status: rest.status ?? 'active',
      };
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/users/:id – update user (e.g. status block/unblock) */
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const allowed = ['status'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No allowed fields to update' });
    }
    if (updates.status && !['active', 'pending', 'blocked'].includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newStatus = updates.status ?? user.status ?? 'active';
    notifyUserStatusChanged(id, newStatus);
    const { _id, passwordHash, __v, ...rest } = user;
    return res.json({ id: _id.toString(), ...rest, status: rest.status ?? 'active' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/admin/users/:id/reset-password – set temporary password; user is notified via socket to re-login */
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const newPassword = req.body?.newPassword;
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'newPassword is required' });
    }
    const trimmed = newPassword.trim();
    if (trimmed.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const passwordHash = await bcrypt.hash(trimmed, SALT_ROUNDS);
    await User.findByIdAndUpdate(id, { $set: { passwordHash } });
    notifyPasswordReset(id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/users/:id – delete user; they are notified via socket and logged out */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    notifyUserDeleted(id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Event management (admin) ----------

/** GET /api/admin/events – list all events (including blocked) with shelter name for admin dashboard */
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1, createdAt: -1 }).lean();
    const shelterIds = [...new Set(events.map((e) => e.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name organizationName')
      .lean();
    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
      ])
    );
    const list = events.map((e) => ({
      id: e._id.toString(),
      shelterId: e.shelterId,
      shelterName: shelterById[e.shelterId] ?? '—',
      title: e.title,
      date: e.date,
      time: e.time || undefined,
      location: e.location,
      description: e.description,
      bannerUrl: e.bannerUrl || undefined,
      priceText: e.priceText || undefined,
      blocked: !!e.blocked,
      likeCount: (e.likedBy || []).length,
      createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/events/:id – get one event by id (admin). Returns event even when blocked. Same shape as public event + blocked. */
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const e = await Event.findById(id).lean();
    if (!e) return res.status(404).json({ error: 'Event not found' });
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
      blocked: !!e.blocked,
      createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
    };
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
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/events/:id – update event (admin). Only blocked is allowed. Emits events:changed for real-time. */
router.patch('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blocked = req.body?.blocked;
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'blocked (boolean) is required' });
    }
    const doc = await Event.findByIdAndUpdate(id, { $set: { blocked } }, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Event not found' });
    notifyEventsChanged();
    return res.json({
      id: doc._id.toString(),
      blocked: !!doc.blocked,
      title: doc.title,
      date: doc.date,
      shelterId: doc.shelterId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Fundraising campaigns (admin: list, approve/reject, edit, delete) ----------

/** GET /api/admin/fundraising – list all campaigns with shelter name */
router.get('/fundraising', async (req, res) => {
  try {
    const status = req.query.status; // optional: pending | approved | rejected
    const query = status && ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};
    const campaigns = await FundraisingCampaign.find(query).sort({ createdAt: -1 }).lean();
    const shelterIds = [...new Set(campaigns.map((c) => c.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('name organizationName')
      .lean();
    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
      ])
    );
    const campaignIds = campaigns.map((c) => c._id);
    const donationSums = await Donation.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$campaignId', total: { $sum: '$amount' } } },
    ]);
    const raisedByCampaign = Object.fromEntries(donationSums.map((d) => [d._id.toString(), d.total]));
    const list = campaigns.map((c) => ({
      id: c._id.toString(),
      shelterId: c.shelterId,
      shelterName: shelterById[c.shelterId] ?? '—',
      title: c.title,
      description: c.description || undefined,
      imageUrl: c.imageUrl || undefined,
      goal: c.goal,
      raised: raisedByCampaign[c._id.toString()] ?? c.raised ?? 0,
      endDate: c.endDate,
      status: c.status,
      createdAt: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
    }));
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/admin/fundraising/:id – approve/reject or edit campaign (admin only) */
router.patch('/fundraising/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const doc = await FundraisingCampaign.findById(id);
    if (!doc) return res.status(404).json({ error: 'Campaign not found' });
    const updates = {};
    if (body.status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.status = body.status;
      if (body.status === 'approved') {
        await Notification.create({
          shelterId: doc.shelterId,
          type: 'fundraising',
          title: 'Campaign approved',
          message: `Your fundraising campaign "${doc.title}" has been approved and is now public.`,
          link: '/dashboard/shelter/fundraising',
          read: false,
        });
        notifyNotificationsChanged();
        notifyFundraisingApproved(doc.shelterId, id);
      } else if (body.status === 'rejected') {
        await Notification.create({
          shelterId: doc.shelterId,
          type: 'fundraising',
          title: 'Campaign not approved',
          message: `Your fundraising campaign "${doc.title}" was not approved. You can create a new campaign.`,
          link: '/dashboard/shelter/fundraising',
          read: false,
        });
        notifyNotificationsChanged();
      }
    }
    const allowedEdit = ['title', 'description', 'imageUrl', 'goal', 'endDate'];
    for (const key of allowedEdit) {
      if (body[key] === undefined) continue;
      if (key === 'goal') {
        const n = Number(body[key]);
        if (isNaN(n) || n < 0) continue;
        updates[key] = Math.round(n);
      } else {
        updates[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const updated = await FundraisingCampaign.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    notifyFundraisingChanged();
    const raisedAgg = await Donation.aggregate([
      { $match: { campaignId: updated._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const raised = raisedAgg[0]?.total ?? updated.raised ?? 0;
    return res.json({
      id: updated._id.toString(),
      shelterId: updated.shelterId,
      title: updated.title,
      description: updated.description || undefined,
      imageUrl: updated.imageUrl || undefined,
      goal: updated.goal,
      raised,
      endDate: updated.endDate,
      status: updated.status,
      createdAt: updated.createdAt?.toISOString?.() ?? new Date(updated.createdAt).toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/fundraising/:id – delete campaign (admin only) */
router.delete('/fundraising/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FundraisingCampaign.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Campaign not found' });
    notifyFundraisingChanged();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

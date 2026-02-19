import express from 'express';
import { FundraisingCampaign } from '../models/FundraisingCampaign.js';
import { Donation } from '../models/Donation.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { notifyFundraisingChanged, notifyDonationsChanged, notifyNotificationsChanged } from '../socket.js';

const router = express.Router();

/** GET /api/fundraising – list approved campaigns only (public). Optional ?shelterId= for one shelter. */
router.get('/', async (req, res) => {
  try {
    const shelterId = req.query.shelterId ? String(req.query.shelterId).trim() : null;
    const filter = { status: 'approved' };
    if (shelterId) filter.shelterId = shelterId;
    const campaigns = await FundraisingCampaign.find(filter).sort({ createdAt: -1 }).lean();
    const campaignIds = campaigns.map((c) => c._id);
    const donationSums = await Donation.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$campaignId', total: { $sum: '$amount' } } },
    ]);
    const raisedByCampaign = Object.fromEntries(donationSums.map((d) => [d._id.toString(), d.total]));
    const shelterIds = [...new Set(campaigns.map((c) => c.shelterId))];
    const users = await User.find({ _id: { $in: shelterIds }, role: 'shelter' })
      .select('organizationName name district')
      .lean();
    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        {
          name: (u.organizationName && String(u.organizationName).trim()) || u.name || '—',
          district: u.district ? String(u.district).trim() : null,
        },
      ])
    );
    const list = campaigns.map((c) => {
      const shelter = shelterById[c.shelterId] || { name: '—', district: null };
      return {
      id: c._id.toString(),
      shelterId: c.shelterId,
      shelterName: shelter.name,
      shelterDistrict: shelter.district || undefined,
      title: c.title,
      description: c.description || undefined,
      imageUrl: c.imageUrl || undefined,
      goal: c.goal,
      raised: raisedByCampaign[c._id.toString()] ?? c.raised ?? 0,
      endDate: c.endDate,
      createdAt: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
    };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/fundraising/:id/donate – submit a donation (public). Saves to DB; no real payment processing. */
router.post('/:id/donate', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await FundraisingCampaign.findOne({ _id: id, status: 'approved' }).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const body = req.body || {};
    const donorName = String(body.donorName ?? '').trim();
    if (!donorName) return res.status(400).json({ error: 'Donor name is required' });
    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 100) return res.status(400).json({ error: 'Amount must be at least LKR 100' });
    const doc = await Donation.create({
      donorName,
      donorEmail: body.donorEmail != null ? String(body.donorEmail).trim() : null,
      donorPhone: body.donorPhone != null ? String(body.donorPhone).trim() : null,
      amount: Math.round(amount),
      shelterId: campaign.shelterId,
      campaignId: campaign._id,
      campaignName: campaign.title || null,
      type: 'one-time',
    });
    await Notification.create({
      shelterId: String(campaign.shelterId),
      type: 'donation',
      title: 'New donation',
      message: `LKR ${Math.round(amount).toLocaleString()} from ${donorName}${campaign.title ? ` for "${campaign.title}"` : ''}.`,
      link: '/dashboard/shelter/fundraising',
      read: false,
    });
    notifyFundraisingChanged();
    notifyDonationsChanged();
    notifyNotificationsChanged();
    res.status(201).json({
      id: doc._id.toString(),
      donorName: doc.donorName,
      donorEmail: doc.donorEmail ?? null,
      donorPhone: doc.donorPhone ?? null,
      amount: doc.amount,
      campaignId: id,
      campaignName: doc.campaignName ?? null,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/fundraising/:id – single approved campaign with full shelter details (public) */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await FundraisingCampaign.findOne({ _id: id, status: 'approved' }).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const [raisedAgg, shelterUser] = await Promise.all([
      Donation.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.findOne({ _id: campaign.shelterId, role: 'shelter' })
        .select('name email organizationName address district contactEmail contactNumberShelter description website logoUrl ownerName ownerEmail ownerPhone')
        .lean(),
    ]);
    const raised = raisedAgg[0]?.total ?? campaign.raised ?? 0;
    const shelterName = (shelterUser?.organizationName && String(shelterUser.organizationName).trim()) || shelterUser?.name || 'Shelter';
    const payload = {
      id: campaign._id.toString(),
      shelterId: campaign.shelterId,
      shelterName,
      title: campaign.title,
      description: campaign.description || undefined,
      imageUrl: campaign.imageUrl || undefined,
      goal: campaign.goal,
      raised,
      endDate: campaign.endDate,
      createdAt: campaign.createdAt?.toISOString?.() ?? new Date(campaign.createdAt).toISOString(),
      shelter: shelterUser
        ? {
            id: shelterUser._id.toString(),
            name: shelterName,
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
          }
        : null,
    };
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

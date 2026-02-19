/**
 * Matchmaking: POST /recommend returns ranked pets for an adopter profile. Role-based (adopter or admin).
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { IntegrationEvent } from '../models/IntegrationEvent.js';
import { getRecommendations } from '../services/matchmaking.js';

const router = express.Router();

/** Require adopter or admin */
function requireAdopterOrAdmin(req, res, next) {
  const role = req.authUser?.role;
  if (role !== 'adopter' && role !== 'admin') {
    return res.status(403).json({ error: 'Adopter or admin access required' });
  }
  next();
}

/** POST /api/matchmaking/recommend – body: { adopterProfile } (adopterId used for cache when caller is adopter or admin) */
router.post('/recommend', requireAuth, requireAdopterOrAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const adopterProfile = body.adopterProfile;

    if (!adopterProfile || typeof adopterProfile !== 'object' || Object.keys(adopterProfile).length === 0) {
      return res.status(400).json({ error: 'adopterProfile (object) is required' });
    }

    const adopterId = req.authUser?.role === 'adopter' ? req.userId : (body.adopterId && req.authUser?.role === 'admin' ? body.adopterId : null);

    const start = Date.now();
    const results = await getRecommendations(adopterProfile, adopterId);
    const latencyMs = Date.now() - start;

    await IntegrationEvent.create({
      type: 'matchmaking',
      status: 'success',
      latencyMs,
      message: `${results.length} pets ranked`,
      createdBy: req.userId,
    }).catch(() => {});

    return res.json({
      recommendations: results,
      count: results.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Recommendation request failed' });
  }
});

export default router;

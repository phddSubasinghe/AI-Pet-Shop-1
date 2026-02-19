/**
 * Admin-only health snapshot and SSE stream. Protected by requireAuth + requireAdmin.
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import mongoose from 'mongoose';
import { IntegrationEvent } from '../models/IntegrationEvent.js';
const router = express.Router();
router.use(requireAuth, requireAdmin);

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

async function getHealthSnapshot() {
  const dbState = mongoose.connection.readyState;
  const mongodb = DB_STATES[dbState] ?? 'unknown';
  const database = mongodb === 'connected' ? 'connected' : 'disconnected';

  let openaiStatus = 'unknown';
  let openaiLastSuccessAt = null;
  const lastSuccess = await IntegrationEvent.findOne(
    { type: 'openai_test', status: 'success' },
    { sort: { createdAt: -1 }, createdAt: 1 }
  ).lean();
  if (lastSuccess) {
    openaiLastSuccessAt = lastSuccess.createdAt?.toISOString?.() ?? new Date(lastSuccess.createdAt).toISOString();
    openaiStatus = 'configured';
  } else {
    const settings = await import('../services/openai.js').then((m) => m.getSettings());
    openaiStatus = settings ? 'configured' : 'not_configured';
  }

  return {
    backend: 'ok',
    database,
    mongodb,
    openai: {
      status: openaiStatus,
      lastSuccessAt: openaiLastSuccessAt,
    },
    queue: 'not_applicable',
    timestamp: new Date().toISOString(),
  };
}

/** GET /api/admin/health – current health snapshot */
router.get('/', async (req, res) => {
  try {
    const snapshot = await getHealthSnapshot();
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({
      backend: 'ok',
      database: 'error',
      openai: { status: 'unknown', lastSuccessAt: null },
      queue: 'not_applicable',
      error: err?.message ?? 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/** GET /api/admin/health/stream – SSE stream of health updates */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush?.();
  };

  const interval = setInterval(async () => {
    try {
      const snapshot = await getHealthSnapshot();
      send(snapshot);
    } catch {
      send({ backend: 'ok', database: 'error', openai: { status: 'unknown', lastSuccessAt: null }, queue: 'not_applicable', timestamp: new Date().toISOString() });
    }
  }, 5000);

  getHealthSnapshot()
    .then(send)
    .catch(() => {
      send({ backend: 'ok', database: 'error', openai: { status: 'unknown', lastSuccessAt: null }, queue: 'not_applicable', timestamp: new Date().toISOString() });
    });

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;

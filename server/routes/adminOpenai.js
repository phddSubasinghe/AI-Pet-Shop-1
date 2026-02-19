/**
 * Admin-only OpenAI settings and test. All routes protected by requireAuth + requireAdmin.
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { OpenAISettings } from '../models/OpenAISettings.js';
import { IntegrationEvent } from '../models/IntegrationEvent.js';
import { encrypt } from '../utils/encrypt.js';
import { getSettings, testConnection } from '../services/openai.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

const SETTINGS_ID = 'openai_settings';

// Rate limit: 5 test requests per minute per admin
const testLimitByUser = new Map();
const TEST_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

function checkTestRateLimit(userId) {
  const now = Date.now();
  let times = testLimitByUser.get(userId) || [];
  times = times.filter((t) => now - t < WINDOW_MS);
  if (times.length >= TEST_LIMIT) return false;
  times.push(now);
  testLimitByUser.set(userId, times);
  return true;
}

/** GET /api/admin/openai/settings – non-secret settings only */
router.get('/settings', async (req, res) => {
  try {
    const doc = await OpenAISettings.findById(SETTINGS_ID).lean();
    if (!doc) {
      return res.json({
        model: 'gpt-4o-mini',
        baseURL: null,
        maxTokens: 1024,
        temperature: 0.3,
        enabled: false,
        hasApiKey: false,
      });
    }
    return res.json({
      model: doc.model || 'gpt-4o-mini',
      baseURL: doc.baseURL ?? null,
      maxTokens: doc.maxTokens ?? 1024,
      temperature: doc.temperature ?? 0.3,
      enabled: !!doc.enabled,
      hasApiKey: !!doc.apiKeyEncrypted,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load settings' });
  }
});

/** PUT /api/admin/openai/settings – update settings; optional apiKey (encrypted at rest) */
router.put('/settings', async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};
    if (typeof body.model === 'string' && body.model.trim()) updates.model = body.model.trim();
    if (body.baseURL !== undefined) updates.baseURL = body.baseURL === '' || body.baseURL == null ? null : String(body.baseURL).trim();
    if (typeof body.maxTokens === 'number' && body.maxTokens >= 1 && body.maxTokens <= 128000) updates.maxTokens = body.maxTokens;
    if (typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 2) updates.temperature = body.temperature;
    if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
    if (typeof body.apiKey === 'string' && body.apiKey.trim()) {
      try {
        updates.apiKeyEncrypted = encrypt(body.apiKey.trim());
      } catch (e) {
        return res.status(400).json({ error: 'API key encryption failed. Set OPENAI_KEY_ENC_SECRET in env.' });
      }
    }
    updates.updatedBy = req.userId;

    const doc = await OpenAISettings.findByIdAndUpdate(
      SETTINGS_ID,
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await IntegrationEvent.create({
      type: 'settings_updated',
      status: 'success',
      message: 'OpenAI settings updated',
      createdBy: req.userId,
    });

    return res.json({
      model: doc.model || 'gpt-4o-mini',
      baseURL: doc.baseURL ?? null,
      maxTokens: doc.maxTokens ?? 1024,
      temperature: doc.temperature ?? 0.3,
      enabled: !!doc.enabled,
      hasApiKey: !!doc.apiKeyEncrypted,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

/** POST /api/admin/openai/test – run a small OpenAI request; rate limited */
router.post('/test', async (req, res) => {
  const userId = String(req.userId);
  if (!checkTestRateLimit(userId)) {
    return res.status(429).json({ error: 'Too many test requests. Try again in a minute.' });
  }
  try {
    const result = await testConnection();
    await IntegrationEvent.create({
      type: 'openai_test',
      status: result.success ? 'success' : 'fail',
      latencyMs: result.latencyMs,
      message: result.success ? null : result.error,
      createdBy: req.userId,
    });
    return res.json({
      success: result.success,
      latencyMs: result.latencyMs,
      model: result.model,
      sampleOutput: result.sampleOutput,
      error: result.error,
    });
  } catch (err) {
    await IntegrationEvent.create({
      type: 'openai_test',
      status: 'fail',
      message: err?.message || 'Test failed',
      createdBy: req.userId,
    });
    return res.status(500).json({
      success: false,
      error: 'Test request failed',
      latencyMs: null,
      model: null,
      sampleOutput: null,
    });
  }
});

/** GET /api/admin/openai/events – last 20 integration events (for logs panel) */
router.get('/events', async (req, res) => {
  try {
    const list = await IntegrationEvent.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const items = list.map((e) => ({
      id: e._id.toString(),
      type: e.type,
      status: e.status,
      latencyMs: e.latencyMs ?? null,
      message: e.message ?? null,
      createdAt: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
    }));
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load events' });
  }
});

export default router;

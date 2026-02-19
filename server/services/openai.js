/**
 * OpenAI service: settings resolution and test connection. All OpenAI calls server-side only.
 */

import OpenAI from 'openai';
import { OpenAISettings } from '../models/OpenAISettings.js';
import { decrypt } from '../utils/encrypt.js';

const SETTINGS_ID = 'openai_settings';

/**
 * Get decrypted settings for server-side use. Returns null if no key or disabled.
 */
export async function getSettings() {
  const doc = await OpenAISettings.findById(SETTINGS_ID).lean();
  if (!doc || !doc.apiKeyEncrypted || !doc.enabled) return null;
  const apiKey = decrypt(doc.apiKeyEncrypted);
  if (!apiKey) return null;
  return {
    apiKey,
    model: doc.model || 'gpt-4o-mini',
    baseURL: doc.baseURL || undefined,
    maxTokens: doc.maxTokens ?? 1024,
    temperature: doc.temperature ?? 0.3,
    enabled: true,
  };
}

/**
 * Run a minimal OpenAI request and return metrics. Never log apiKey.
 */
export async function testConnection() {
  const settings = await getSettings();
  if (!settings) {
    return { success: false, error: 'OpenAI is not configured or disabled', latencyMs: null, model: null, sampleOutput: null };
  }
  const start = Date.now();
  try {
    const client = new OpenAI({
      apiKey: settings.apiKey,
      ...(settings.baseURL && { baseURL: settings.baseURL }),
    });
    const completion = await client.chat.completions.create({
      model: settings.model,
      max_tokens: Math.min(settings.maxTokens, 100),
      temperature: settings.temperature,
      messages: [{ role: 'user', content: 'Reply with exactly: {"ok":true,"service":"openai"}' }],
    });
    const latencyMs = Date.now() - start;
    const content = completion.choices?.[0]?.message?.content ?? '';
    let sampleOutput = content;
    try {
      sampleOutput = JSON.stringify(JSON.parse(content));
    } catch {
      // keep as string
    }
    return {
      success: true,
      error: null,
      latencyMs,
      model: completion.model || settings.model,
      sampleOutput,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err?.message || String(err);
    return {
      success: false,
      error: message,
      latencyMs,
      model: settings.model,
      sampleOutput: null,
    };
  }
}

/** JSON schema for matchmaking structured output (deterministic scoring guidance). */
const MATCHMAKING_RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'matchmaking_result',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        score: { type: 'integer', description: 'Compatibility score 0-100' },
        label: { type: 'string', enum: ['SUITABLE', 'CONDITIONAL', 'NOT_SUITABLE'] },
        reasons: { type: 'array', items: { type: 'string' }, description: 'Brief compatibility reasons' },
        risks: { type: 'array', items: { type: 'string' }, description: 'Potential risks or concerns' },
        missing_info: { type: 'array', items: { type: 'string' }, description: 'Missing information that would help' },
        version: { type: 'string', description: 'Schema version e.g. 1.0' },
      },
      required: ['score', 'label', 'reasons', 'risks', 'missing_info', 'version'],
      additionalProperties: false,
    },
  },
};

/**
 * Score adopter–pet compatibility via OpenAI (structured output). Returns null on error or no config.
 */
export async function scoreMatch(adopterProfile, petProfile) {
  const settings = await getSettings();
  if (!settings) return null;
  try {
    const client = new OpenAI({
      apiKey: settings.apiKey,
      ...(settings.baseURL && { baseURL: settings.baseURL }),
    });
    const prompt = `You are a pet adoption compatibility scorer. Score 0-100 with strict rules:
- SUITABLE: strong match (score >= 70). CONDITIONAL: possible with caveats (40-69). NOT_SUITABLE: poor match (0-39).
- Be consistent: same inputs should yield the same score. Prefer round numbers (e.g. 75, 50, 25).
- reasons: 2-4 short bullet points. risks: list any concerns. missing_info: what we don't know.
- If the adopter provided additionalInterests (free text), use it: match their stated interests, breed or trait preferences, and concerns against the pet's breed, description, and full profile. Factor this into the score and reasons.

Adopter: ${JSON.stringify(adopterProfile)}
Pet: ${JSON.stringify(petProfile)}

Return JSON only.`;
    const completion = await client.chat.completions.create({
      model: settings.model,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
      messages: [{ role: 'user', content: prompt }],
      response_format: MATCHMAKING_RESPONSE_SCHEMA,
    });
    const content = completion.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      label: ['SUITABLE', 'CONDITIONAL', 'NOT_SUITABLE'].includes(parsed.label) ? parsed.label : 'CONDITIONAL',
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info : [],
      version: String(parsed.version || '1.0'),
    };
  } catch {
    return null;
  }
}

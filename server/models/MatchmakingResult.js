import mongoose from 'mongoose';

/**
 * Cached matchmaking result per adopter+pet+profileHash. Optional TTL (e.g. 24h).
 */
const matchmakingResultSchema = new mongoose.Schema(
  {
    adopterId: { type: String, index: true },
    petId: { type: String, required: true, index: true },
    profileHash: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    label: { type: String, enum: ['SUITABLE', 'CONDITIONAL', 'NOT_SUITABLE'], required: true },
    reasons: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    missingInfo: { type: [String], default: [] },
    version: { type: String, default: '1.0', trim: true },
  },
  { timestamps: true }
);

matchmakingResultSchema.index({ adopterId: 1, petId: 1, profileHash: 1 });
matchmakingResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // 24h TTL optional

export const MatchmakingResult = mongoose.model('MatchmakingResult', matchmakingResultSchema);

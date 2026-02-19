import mongoose from 'mongoose';

/**
 * Audit/observability for OpenAI and matchmaking. Never store secrets.
 */
const integrationEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['openai_test', 'openai_health', 'matchmaking', 'settings_updated'],
      required: true,
    },
    status: { type: String, enum: ['success', 'fail'], required: true },
    latencyMs: { type: Number, default: null },
    message: { type: String, default: null, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

integrationEventSchema.index({ type: 1, createdAt: -1 });
integrationEventSchema.index({ createdAt: -1 });

export const IntegrationEvent = mongoose.model('IntegrationEvent', integrationEventSchema);

import mongoose from 'mongoose';

/**
 * Single-document collection for OpenAI config. Use constant id 'openai_settings'.
 * API key is stored encrypted; never expose to client.
 */
const openAISettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, default: 'openai_settings' },
    apiKeyEncrypted: { type: String, default: null },
    model: { type: String, default: 'gpt-4o-mini', trim: true },
    baseURL: { type: String, default: null, trim: true },
    maxTokens: { type: Number, default: 1024, min: 1, max: 128000 },
    temperature: { type: Number, default: 0.3, min: 0, max: 2 },
    enabled: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

openAISettingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.apiKeyEncrypted;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const OpenAISettings = mongoose.model('OpenAISettings', openAISettingsSchema);

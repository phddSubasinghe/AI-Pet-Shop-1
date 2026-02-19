import mongoose from 'mongoose';

const adoptionRequestSchema = new mongoose.Schema(
  {
    adopterId: { type: String, required: true, index: true },
    adopterName: { type: String, required: true, trim: true },
    adopterEmail: { type: String, required: true, trim: true, lowercase: true },
    adopterAddress: { type: String, default: '', trim: true },
    petId: { type: String, required: true, index: true },
    shelterId: { type: String, required: true, index: true },
    petName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['New', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected', 'Cancelled'],
      default: 'New',
    },
    compatibilityScore: { type: Number, default: null, min: 0, max: 100 },
    aiReasons: { type: [String], default: [] },
    message: { type: String, default: '', trim: true },
    escalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adoptionRequestSchema.index({ shelterId: 1, createdAt: -1 });

adoptionRequestSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.appliedAt = ret.createdAt?.toISOString?.() ?? new Date(ret.createdAt).toISOString();
    ret.updatedAt = ret.updatedAt?.toISOString?.() ?? new Date(ret.updatedAt).toISOString();
    return ret;
  },
});

export const AdoptionRequest = mongoose.model('AdoptionRequest', adoptionRequestSchema);

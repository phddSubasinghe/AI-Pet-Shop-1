import mongoose from 'mongoose';

const shelterPayoutSchema = new mongoose.Schema(
  {
    shelterId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

shelterPayoutSchema.index({ shelterId: 1, createdAt: -1 });

export const ShelterPayout = mongoose.model('ShelterPayout', shelterPayoutSchema);

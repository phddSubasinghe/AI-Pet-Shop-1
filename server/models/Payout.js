import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payoutSchema.index({ sellerId: 1, createdAt: -1 });

export const Payout = mongoose.model('Payout', payoutSchema);

import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true, trim: true },
    donorEmail: { type: String, trim: true, default: null },
    donorPhone: { type: String, trim: true, default: null },
    amount: { type: Number, required: true, min: 0 },
    shelterId: { type: String, required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'FundraisingCampaign', default: null, index: true },
    campaignName: { type: String, trim: true, default: null },
    type: { type: String, enum: ['one-time', 'recurring'], default: 'one-time' },
  },
  { timestamps: true }
);

donationSchema.index({ shelterId: 1, createdAt: -1 });

export const Donation = mongoose.model('Donation', donationSchema);

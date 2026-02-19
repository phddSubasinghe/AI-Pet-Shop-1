import mongoose from 'mongoose';

const fundraisingCampaignSchema = new mongoose.Schema(
  {
    shelterId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** Image URL (e.g. /api/shelter/campaigns/uploads/...) stored in server/data/funds */
    imageUrl: { type: String, default: '', trim: true },
    goal: { type: Number, required: true, min: 0 },
    raised: { type: Number, default: 0, min: 0 },
    endDate: { type: String, required: true, trim: true },
    /** pending = awaiting admin review; approved = public; rejected = not shown */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

fundraisingCampaignSchema.index({ shelterId: 1, createdAt: -1 });
fundraisingCampaignSchema.index({ status: 1, endDate: 1 });

fundraisingCampaignSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const FundraisingCampaign = mongoose.model('FundraisingCampaign', fundraisingCampaignSchema);

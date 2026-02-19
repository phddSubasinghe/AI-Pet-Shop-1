import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    shelterId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, default: '', trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bannerUrl: { type: String, default: '', trim: true },
    /** Optional display price e.g. "Free", "GHS 150", "Starts from LKR 500" */
    priceText: { type: String, default: '', trim: true },
    /** Visitor ids who liked (no login); count = likedBy.length */
    likedBy: { type: [String], default: [] },
    /** When true, event is hidden from public and adopters (admin-only block) */
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ shelterId: 1, date: -1 });
eventSchema.index({ date: 1 });

eventSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Event = mongoose.model('Event', eventSchema);

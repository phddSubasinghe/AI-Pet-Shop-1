import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    sellerId: { type: String, default: null, index: true },
    shelterId: { type: String, default: null, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    link: { type: String, default: null, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ sellerId: 1, createdAt: -1 });
notificationSchema.index({ shelterId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

import mongoose from 'mongoose';

const adoptionReviewSchema = new mongoose.Schema(
  {
    adopterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adopterName: { type: String, required: true, trim: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: null },
    petName: { type: String, trim: true, default: null },
    image: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

adoptionReviewSchema.index({ createdAt: -1 });

adoptionReviewSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const AdoptionReview = mongoose.model('AdoptionReview', adoptionReviewSchema);

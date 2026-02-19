import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    shelterId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ['dog', 'cat'], required: true },
    breed: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 30 },
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    image: { type: String, default: '', trim: true },
    photos: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    status: { type: String, enum: ['available', 'pending', 'adopted'], default: 'available' },
    adoptionStatus: { type: String, enum: ['Available', 'Reserved', 'Adopted'], default: 'Available' },
    temperament: { type: String, default: '', trim: true },
    vaccinationStatus: { type: String, enum: ['up-to-date', 'partial', 'not-started', 'unknown'], default: 'unknown' },
    medicalNotes: { type: String, default: '', trim: true },
    specialCareNeeds: { type: String, default: '', trim: true },
    livingSpace: { type: String, enum: ['apartment', 'house', 'house-with-yard'], required: true },
    energyLevel: { type: String, enum: ['low', 'medium', 'high', 'very-high'], required: true },
    experience: { type: String, enum: ['first-time', 'some', 'experienced'], required: true },
    kids: { type: String, enum: ['none', 'young', 'older', 'any'], required: true },
    specialCare: { type: String, enum: ['none', 'anxiety', 'medical', 'senior', 'training'], required: true },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    weight: { type: Number, default: null, min: 0, max: 200 },
    height: { type: Number, default: null, min: 0, max: 150 },
    description: { type: String, default: '', trim: true },
    archived: { type: Boolean, default: false },
    /** For dogs: whether safe with cats. Cats are treated as cat-friendly. */
    catFriendly: { type: Boolean, default: null },
  },
  { timestamps: true }
);

petSchema.index({ shelterId: 1, updatedAt: -1 });

petSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.createdAt = ret.createdAt?.toISOString?.() ?? new Date(ret.createdAt).toISOString();
    ret.updatedAt = ret.updatedAt?.toISOString?.() ?? new Date(ret.updatedAt).toISOString();
    return ret;
  },
});

export const Pet = mongoose.model('Pet', petSchema);

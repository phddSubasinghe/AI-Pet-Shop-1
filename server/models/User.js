import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['seller', 'shelter', 'adopter', 'admin'], required: true },
    status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'active' },
    name: { type: String, required: true, trim: true },
    // Seller
    shopName: { type: String, trim: true, default: null },
    pickupAddress: { type: String, trim: true, default: null },
    contactNumber: { type: String, trim: true, default: null },
    // Shelter (AWO)
    organizationName: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    district: { type: String, trim: true, default: null },
    contactEmail: { type: String, trim: true, default: null },
    contactNumberShelter: { type: String, trim: true, default: null },
    description: { type: String, default: null },
    website: { type: String, trim: true, default: null },
    logoUrl: { type: String, trim: true, default: null },
    ownerName: { type: String, trim: true, default: null },
    ownerEmail: { type: String, trim: true, default: null },
    ownerPhone: { type: String, trim: true, default: null },
    // Adopter: liked pets and wishlist (pet ids)
    likedPetIds: { type: [String], default: [] },
    wishlistPetIds: { type: [String], default: [] },
    // Adopter: wishlist product ids (pet store)
    wishlistProductIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Don't expose passwordHash in JSON
userSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);

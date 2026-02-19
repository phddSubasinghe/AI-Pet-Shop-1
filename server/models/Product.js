import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0, max: 100, default: null },
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    sellerId: { type: String, default: null },
    sellerName: { type: String, default: null },
  },
  { timestamps: true }
);

// Return id as string and remove __v for API responses
productSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = mongoose.model('Product', productSchema);

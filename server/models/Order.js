import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    sellerId: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'New' },
    statusHistory: [{ status: { type: String }, at: { type: Date } }],
    paymentMethod: { type: String, trim: true, default: null },
    cardLast4: { type: String, trim: true, maxlength: 4, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.sellerId': 1, createdAt: -1 });

orderSchema.set('toJSON', {
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

export const Order = mongoose.model('Order', orderSchema);

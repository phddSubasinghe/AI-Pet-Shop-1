/**
 * Mock data for Seller dashboard until backend is connected.
 */

import type {
  SellerProduct,
  SellerOrder,
  SellerReview,
  SellerPayout,
  SellerStoreProfile,
  SellerScoreBreakdown,
} from "@/types/seller";

export const mockSellerProducts: SellerProduct[] = [
  {
    id: "prod-1",
    name: "Premium Dog Food 2kg",
    category: "Food",
    price: 2500,
    discount: 10,
    stock: 45,
    lowStockThreshold: 10,
    status: "active",
    description: "High-quality nutrition for adult dogs.",
    images: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400"],
    tags: ["dog", "food", "premium"],
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-14T09:00:00Z",
  },
  {
    id: "prod-2",
    name: "Cat Scratching Post",
    category: "Toys",
    price: 1800,
    stock: 8,
    lowStockThreshold: 5,
    status: "active",
    description: "Durable sisal scratching post.",
    images: [],
    tags: ["cat", "toys"],
    createdAt: "2025-02-01T12:00:00Z",
    updatedAt: "2025-02-14T09:00:00Z",
  },
  {
    id: "prod-3",
    name: "Pet Carrier Medium",
    category: "Accessories",
    price: 4500,
    stock: 22,
    lowStockThreshold: 5,
    status: "active",
    description: "Ventilated carrier for travel.",
    images: [],
    tags: ["carrier", "travel"],
    createdAt: "2025-01-20T08:00:00Z",
    updatedAt: "2025-02-14T09:00:00Z",
  },
];

export const mockSellerOrders: SellerOrder[] = [
  {
    id: "ord-1",
    customerName: "Nadeesha Perera",
    customerEmail: "nadeesha@email.com",
    address: "123 Main St, Colombo 5",
    items: [
      { productId: "prod-1", productName: "Premium Dog Food 2kg", quantity: 2, unitPrice: 2250, total: 4500 },
    ],
    subtotal: 4500,
    shipping: 200,
    total: 4700,
    status: "New",
    createdAt: "2025-02-14T09:30:00Z",
    updatedAt: "2025-02-14T09:30:00Z",
    statusHistory: [{ status: "New", at: "2025-02-14T09:30:00Z" }],
  },
  {
    id: "ord-2",
    customerName: "Samantha J.",
    customerEmail: "s.j@email.com",
    address: "45 Lake Rd, Kandy",
    items: [
      { productId: "prod-2", productName: "Cat Scratching Post", quantity: 1, unitPrice: 1800, total: 1800 },
    ],
    subtotal: 1800,
    total: 1800,
    status: "Shipped",
    createdAt: "2025-02-13T14:00:00Z",
    updatedAt: "2025-02-14T08:00:00Z",
    statusHistory: [
      { status: "New", at: "2025-02-13T14:00:00Z" },
      { status: "Processing", at: "2025-02-13T16:00:00Z" },
      { status: "Shipped", at: "2025-02-14T08:00:00Z" },
    ],
  },
  {
    id: "ord-3",
    customerName: "Dilshan F.",
    customerEmail: "dilshan@email.com",
    address: "78 Beach Rd, Galle",
    items: [
      { productId: "prod-1", productName: "Premium Dog Food 2kg", quantity: 1, unitPrice: 2250, total: 2250 },
      { productId: "prod-3", productName: "Pet Carrier Medium", quantity: 1, unitPrice: 4500, total: 4500 },
    ],
    subtotal: 6750,
    shipping: 300,
    total: 7050,
    status: "Delivered",
    createdAt: "2025-02-10T11:00:00Z",
    updatedAt: "2025-02-12T17:00:00Z",
    statusHistory: [
      { status: "New", at: "2025-02-10T11:00:00Z" },
      { status: "Processing", at: "2025-02-10T15:00:00Z" },
      { status: "Shipped", at: "2025-02-11T09:00:00Z" },
      { status: "Delivered", at: "2025-02-12T17:00:00Z" },
    ],
  },
];

export const mockSellerReviews: SellerReview[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    productName: "Premium Dog Food 2kg",
    customerName: "Nadeesha P.",
    rating: 5,
    comment: "My dog loves it. Fast delivery!",
    createdAt: "2025-02-13T10:00:00Z",
  },
  {
    id: "rev-2",
    productId: "prod-2",
    productName: "Cat Scratching Post",
    customerName: "Samantha J.",
    rating: 4,
    comment: "Good quality, cat uses it daily.",
    createdAt: "2025-02-12T14:30:00Z",
  },
  {
    id: "rev-3",
    productId: "prod-1",
    productName: "Premium Dog Food 2kg",
    customerName: "Dilshan F.",
    rating: 5,
    comment: "Great value and packaging.",
    createdAt: "2025-02-11T09:00:00Z",
  },
];

export const mockSellerPayouts: SellerPayout[] = [
  { id: "pay-1", amount: 45000, status: "paid", paidAt: "2025-02-10T12:00:00Z", createdAt: "2025-02-08T10:00:00Z" },
  { id: "pay-2", amount: 32000, status: "pending", createdAt: "2025-02-14T09:00:00Z" },
];

export const mockSellerProfile: SellerStoreProfile = {
  shopName: "Pet Paradise",
  contactNumber: "7712345678",
  pickupAddress: "Warehouse A, Colombo 10",
  logoUrl: "",
  ownerName: "Nimal Perera",
  ownerEmail: "nimal@petparadise.lk",
  ownerPhone: "7723456789",
  verificationStatus: "Pending",
  updatedAt: "2025-02-14T09:00:00Z",
};

/** Monthly revenue for last 6 months (mock). */
export const mockMonthlyRevenue: { month: string; revenue: number }[] = [
  { month: "Sep", revenue: 85000 },
  { month: "Oct", revenue: 92000 },
  { month: "Nov", revenue: 78000 },
  { month: "Dec", revenue: 120000 },
  { month: "Jan", revenue: 95000 },
  { month: "Feb", revenue: 67000 },
];

export function getSellerScoreBreakdown(
  reviews: SellerReview[],
  orders: SellerOrder[]
): SellerScoreBreakdown {
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const delivered = orders.filter((o) => o.status === "Delivered").length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const total = orders.length || 1;
  const deliverySuccessRate = Math.round((delivered / total) * 100);
  const cancelRate = Math.round((cancelled / total) * 100);
  const sellerScorePercent = Math.min(
    100,
    Math.round(avgRating * 15 + deliverySuccessRate * 0.4 - cancelRate * 2)
  );
  return {
    averageRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    deliverySuccessRate,
    cancelRate,
    sellerScorePercent: Math.max(0, sellerScorePercent),
  };
}

export function getTodaysOrdersCount(orders: SellerOrder[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return orders.filter((o) => o.createdAt.slice(0, 10) === today).length;
}

export function getPendingOrdersCount(orders: SellerOrder[]): number {
  return orders.filter((o) => ["New", "Processing", "Shipped"].includes(o.status)).length;
}

export function getThisMonthRevenue(orders: SellerOrder[]): number {
  const now = new Date();
  const thisMonth = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  return thisMonth.reduce((s, o) => s + o.total, 0);
}

export function getLowStockProducts(products: SellerProduct[]): SellerProduct[] {
  return products.filter((p) => p.stock <= p.lowStockThreshold);
}

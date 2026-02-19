/**
 * Seller dashboard types: products, orders, reviews, earnings, store profile.
 */

export type ProductStatus = "active" | "hidden";
export type OrderStatus = "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface SellerProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  discount?: number;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  description: string;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Set when creating/updating from seller dashboard; shown in admin list */
  sellerId?: string | null;
  sellerName?: string | null;
  /** Populated by API when fetching a single product (GET by id) for customer display */
  seller?: ProductSellerInfo | null;
}

/** Seller info shown on product detail (public profile) */
export interface ProductSellerInfo {
  name: string;
  shopName: string | null;
  contactNumber: string | null;
  logoUrl: string | null;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SellerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping?: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory?: { status: OrderStatus; at: string }[];
  paymentMethod?: string | null;
  cardLast4?: string | null;
}

export interface SellerReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SellerPayout {
  id: string;
  amount: number;
  status: "pending" | "paid";
  paidAt?: string;
  createdAt: string;
}

export type EarningsPeriod = "monthly" | "weekly" | "daily";

export interface SellerEarningsResponse {
  totalEarnings: number;
  totalPaid: number;
  pendingPayout: number;
  period: EarningsPeriod;
  chartData: { label: string; revenue: number }[];
  payouts: SellerPayout[];
}

export interface SellerStoreProfile {
  shopName: string;
  contactNumber: string;
  pickupAddress: string;
  logoUrl?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  verificationStatus: "Pending" | "Verified";
  updatedAt: string;
}

/** Seller score: 0–100, derived from ratings, delivery success, cancel rate. */
export interface SellerScoreBreakdown {
  averageRating: number;
  reviewCount: number;
  deliverySuccessRate: number;
  cancelRate: number;
  sellerScorePercent: number;
}

export interface SellerOverviewResponse {
  todaysOrders: number;
  pendingOrders: number;
  monthRevenue: number;
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; stock: number; lowStockThreshold: number }[];
  averageRating: number;
  reviewCount: number;
  deliverySuccessRate: number;
  cancelRate: number;
  sellerScorePercent: number;
  topSelling: { id: string; name: string; stock: number }[];
  recentOrders: SellerOrder[];
}

export type SellerNotificationType = "new_order" | "low_stock" | "payout" | "order_status";

export interface SellerNotification {
  id: string;
  type: SellerNotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

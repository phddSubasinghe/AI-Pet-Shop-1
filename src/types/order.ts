export type OrderStatus = "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
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
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discount?: number;
  quantity: number;
  image?: string;
}

export type Department = 'Drinks' | 'Food' | 'Hospitality';

export const SUBCATEGORIES: Record<Department, string[]> = {
  Drinks: ['Soft Drinks', 'Juices', 'Water', 'Alcoholic Beverages'],
  Food: ['Meals', 'Fast Food', 'Snacks', 'Desserts'],
  Hospitality: ['Hotel Services', 'Catering Services', 'Event Services', 'Room Services', 'Other Services']
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  password?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Department;
  subcategory: string;
  description: string;
  priceRWF: number;
  priceUSD: number;
  image: string;
  availability: boolean;
  quantity?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  priceRWF: number;
  priceUSD: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: 'Pending' | 'Confirmed' | 'Delivered';
  totalRWF: number;
  totalUSD: number;
  createdAt: string;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  text: string;
  timestamp: string;
}

export interface Chat {
  orderId: string;
  messages: Message[];
}
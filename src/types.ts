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
  category: string; // 'Food' | 'Drinks' | 'Desserts' | 'Specials'
  description: string;
  price: number;
  image: string;
  availability: boolean; // true = In Stock, false = Out of Stock
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: 'Pending' | 'Confirmed' | 'Delivered';
  total: number;
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

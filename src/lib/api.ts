import { User, Product, Order, Chat, Message } from '../types.js';

const API_BASE = '/api';

// Get authenticating token from local storage
export function getStoredToken(): string | null {
  return localStorage.getItem('bistro_auth_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('bistro_auth_token', token);
  } else {
    localStorage.removeItem('bistro_auth_token');
  }
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('bistro_auth_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem('bistro_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('bistro_auth_user');
  }
}

// Global request fetcher with Authorization token automatically injected
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Network query failure');
  }

  return body as T;
}

// API Methods
export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async register(name: string, email: string, password: string, role: 'admin' | 'customer' = 'customer'): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  },

  // Menu (Products)
  async getMenu(): Promise<Product[]> {
    return request<Product[]>('/menu');
  },

  async createMenuItem(product: Omit<Product, 'id'>): Promise<Product> {
    return request<Product>('/menu', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  async updateMenuItem(id: string, product: Partial<Product>): Promise<Product> {
    return request<Product>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/menu/${id}`, {
      method: 'DELETE'
    });
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    return request<Order[]>('/orders');
  },

  async createOrder(items: { productId: string; quantity: number }[], notes?: string): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items, notes })
    });
  },

  async updateOrderStatus(id: string, status: 'Pending' | 'Confirmed' | 'Delivered'): Promise<Order> {
    return request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Chats
  async getChatMessages(orderId: string): Promise<Chat> {
    return request<Chat>(`/chat/${orderId}`);
  },

  async sendChatMessage(orderId: string, text: string): Promise<Message> {
    return request<Message>(`/chat/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
};

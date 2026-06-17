import { User, Product, Order, Chat, Message } from '../types.js';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('tang_auth_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('tang_auth_token', token);
  } else {
    localStorage.removeItem('tang_auth_token');
  }
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('tang_auth_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem('tang_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('tang_auth_user');
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem('tang_admin_token');
}

export function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem('tang_admin_token', token);
  } else {
    localStorage.removeItem('tang_admin_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const adminToken = getAdminToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (adminToken) {
    headers.set('X-Admin-Token', adminToken);
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

export const api = {
  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  },

  async unlockAdmin(password: string): Promise<{ token: string }> {
    const res = await request<{ token: string }>('/admin/unlock', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    setAdminToken(res.token);
    return res;
  },

  lockAdmin() {
    setAdminToken(null);
  },

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

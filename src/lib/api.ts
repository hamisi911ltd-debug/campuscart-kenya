// API client for backend communication
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Fetch with cache control for fresh data
const fetchWithCache = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache',  // Always get fresh data
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
};

// Products API
export const productsAPI = {
  // Get all products
  getAll: async () => {
    try {
      const response = await fetchWithCache(`${API_URL}/products`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to localStorage for now
      return JSON.parse(localStorage.getItem('campusmart_products') || '[]');
    }
  },

  // Get single product
  getById: async (id: string) => {
    try {
      const response = await fetchWithCache(`${API_URL}/products/${id}`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  // Create product
  create: async (product: any) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to localStorage
      const existing = JSON.parse(localStorage.getItem('campusmart_products') || '[]');
      existing.unshift(product);
      localStorage.setItem('campusmart_products', JSON.stringify(existing));
      return product;
    }
  },

  // Update product
  update: async (id: string, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Delete product
  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Search products
  search: async (query: string) => {
    try {
      const response = await fetchWithCache(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },
};

// Orders API
export const ordersAPI = {
  // Create order
  create: async (order: any) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to localStorage
      const existing = JSON.parse(localStorage.getItem('campusmart_orders') || '[]');
      existing.unshift(order);
      localStorage.setItem('campusmart_orders', JSON.stringify(existing));
      return order;
    }
  },

  // Get user orders
  getByUser: async (userId: string) => {
    try {
      const response = await fetchWithCache(`${API_URL}/orders/user/${userId}`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return JSON.parse(localStorage.getItem('campusmart_orders') || '[]');
    }
  },

  // Update order status
  updateStatus: async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  // Register user
  register: async (userData: any) => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) throw new Error('Registration failed');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) throw new Error('Login failed');
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (userId: string) => {
    try {
      const response = await fetchWithCache(`${API_URL}/users/${userId}`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

export default {
  products: productsAPI,
  orders: ordersAPI,
  users: usersAPI,
};

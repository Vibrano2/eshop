// Frontend Client API service connecting to the Express/SQLite backend with robust local fallback

import { PRODUCTS } from '../data/products';
import { validatePromoCode as localValidatePromo } from '../data/promoCodes';

const API_BASE = '/api';

/**
 * Fetch products from the backend API with fallback to local PRODUCTS
 */
export async function apiFetchProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.subcategory) query.set('subcategory', params.subcategory);
    if (params.q) query.set('q', params.q);
    if (params.minPrice) query.set('minPrice', params.minPrice);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params.sort) query.set('sort', params.sort);
    if (params.limit) query.set('limit', params.limit);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.products || PRODUCTS;
  } catch (err) {
    console.warn('[API fallback] Using local PRODUCTS:', err.message);
    return PRODUCTS;
  }
}

/**
 * Fetch a single product by ID
 */
export async function apiFetchProductById(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.product;
  } catch (err) {
    console.warn('[API fallback] Using local product lookup:', err.message);
    return PRODUCTS.find((p) => p.id === id) || null;
  }
}

/**
 * Create a new order in SQLite database
 */
export async function apiCreateOrder(orderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API fallback] Order creation fallback:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch live order tracking status
 */
export async function apiFetchOrderTracking(orderNumber) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}/track`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.tracking;
  } catch (err) {
    console.warn('[API fallback] Tracking lookup fallback:', err.message);
    return null;
  }
}

/**
 * Validate a promo code through the server
 */
export async function apiValidatePromo(code, subtotal) {
  try {
    const res = await fetch(`${API_BASE}/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API fallback] Using local promo validation:', err.message);
    return localValidatePromo(code, subtotal);
  }
}

/**
 * Subscribe email to newsletter
 */
export async function apiSubscribeNewsletter(email) {
  try {
    const res = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API fallback] Newsletter fallback:', err.message);
    return {
      success: true,
      promoCode: 'BIENVENUE10',
      message: 'Inscription validée ! Code de bienvenue : BIENVENUE10 (-10%).'
    };
  }
}

/**
 * Fetch loyalty account details
 */
export async function apiFetchLoyalty(codeOrEmail) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/${codeOrEmail}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.account;
  } catch (err) {
    console.warn('[API fallback] Loyalty lookup fallback:', err.message);
    return null;
  }
}

/**
 * Claim loyalty reward voucher
 */
export async function apiClaimLoyaltyReward(payload) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API fallback] Claim reward fallback:', err.message);
    return { success: false, error: err.message };
  }
}

// --------------------------------------------------------------------------
// Authentication & User Profile API
// --------------------------------------------------------------------------

const TOKEN_KEY = 'eshop_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Could not persist auth token:', err);
  }
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/**
 * Log in with email and password
 */
export async function apiLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err) {
    console.warn('[API fallback] Local login fallback:', err.message);
    // Offline simulated demo account
    if (email.toLowerCase() === 'demo@eshop-store.eu') {
      const fallbackUser = {
        id: 1,
        email: 'demo@eshop-store.eu',
        firstName: 'Claire',
        lastName: 'Laurent',
        phone: '+33 6 12 34 56 78',
        address: '15 Rue de Rivoli',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
        role: 'customer',
        loyaltyCode: 'ESHOP-EU4821',
        loyaltyPoints: 50
      };
      setAuthToken('mock-demo-token');
      return { success: true, token: 'mock-demo-token', user: fallbackUser };
    }
    return { success: false, error: 'Serveur indisponible.' };
  }
}

/**
 * Register a new user
 */
export async function apiRegister(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err) {
    console.warn('[API fallback] Local register fallback:', err.message);
    const fallbackUser = {
      id: Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'customer',
      loyaltyCode: `ESHOP-EU${Math.floor(1000 + Math.random() * 9000)}`,
      loyaltyPoints: 50
    };
    setAuthToken('mock-reg-token');
    return { success: true, token: 'mock-reg-token', user: fallbackUser };
  }
}

/**
 * Fetch current authenticated user
 */
export async function apiGetMe() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) removeAuthToken();
      return null;
    }
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (err) {
    console.warn('[API fallback] GetMe fallback:', err.message);
    // If mock token was used
    if (token === 'mock-demo-token') {
      return {
        id: 1,
        email: 'demo@eshop-store.eu',
        firstName: 'Claire',
        lastName: 'Laurent',
        address: '15 Rue de Rivoli',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
        role: 'customer',
        loyaltyCode: 'ESHOP-EU4821',
        loyaltyPoints: 50
      };
    }
    return null;
  }
}

/**
 * Log out
 */
export async function apiLogout() {
  const token = getAuthToken();
  try {
    if (token && !token.startsWith('mock-')) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (err) {
    console.warn('Logout notification failed:', err);
  } finally {
    removeAuthToken();
  }
  return { success: true };
}

/**
 * Fetch orders for authenticated user
 */
export async function apiGetUserOrders() {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/auth/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.orders : [];
  } catch (err) {
    console.warn('[API fallback] User orders fallback:', err.message);
    try {
      return JSON.parse(localStorage.getItem('eshop_orders') || '[]');
    } catch {
      return [];
    }
  }
}

/**
 * Update authenticated user's profile and shipping address
 */
export async function apiUpdateProfile(profileData) {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Non authentifié.' };

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API fallback] Profile update fallback:', err.message);
    return {
      success: true,
      user: profileData,
      message: 'Profil mis à jour localement (mode hors-ligne).'
    };
  }
}

/**
 * Change authenticated user's password
 */
export async function apiChangePassword({ currentPassword, newPassword }) {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Non authentifié.' };

  try {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API fallback] Password change fallback:', err.message);
    return { success: false, error: 'Serveur indisponible pour modifier le mot de passe.' };
  }
}

// --------------------------------------------------------------------------
// Admin Back-Office API
// --------------------------------------------------------------------------

/**
 * Fetch executive store statistics and KPIs
 */
export async function apiGetAdminStats() {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.stats;
  } catch (err) {
    console.warn('[API fallback] Admin stats fallback:', err.message);
    return null;
  }
}

/**
 * Fetch all store orders with status and search filters
 */
export async function apiGetAdminOrders(params = {}) {
  const token = getAuthToken();
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.q) query.set('q', params.q);
    if (params.limit) query.set('limit', params.limit);

    const res = await fetch(`${API_BASE}/admin/orders?${query.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.warn('[API fallback] Admin orders fallback:', err.message);
    try {
      return JSON.parse(localStorage.getItem('eshop_orders') || '[]');
    } catch {
      return [];
    }
  }
}

/**
 * Update order status and carrier tracking
 */
export async function apiUpdateOrderStatus(orderNumber, payload) {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/orders/${orderNumber}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API fallback] Admin update status fallback:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch product catalog with inventory stock levels
 */
export async function apiGetAdminProducts(params = {}) {
  const token = getAuthToken();
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.q) query.set('q', params.q);
    if (params.stockFilter) query.set('stockFilter', params.stockFilter);

    const res = await fetch(`${API_BASE}/admin/products?${query.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.warn('[API fallback] Admin products fallback:', err.message);
    return PRODUCTS;
  }
}

/**
 * Update stock level for a product
 */
export async function apiUpdateProductStock(productId, payload) {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API fallback] Admin stock update fallback:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch newsletter subscribers list
 */
export async function apiGetAdminSubscribers() {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/subscribers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.subscribers || [];
  } catch (err) {
    console.warn('[API fallback] Admin subscribers fallback:', err.message);
    return [];
  }
}

/**
 * Helper to export any array of data to CSV file download
 */
export function exportToCsv(filename, rows, headers) {
  if (!rows || !rows.length) return;
  const separator = ';';
  const csvContent = [
    headers.map((h) => `"${h.label}"`).join(separator),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = typeof h.key === 'function' ? h.key(row) : row[h.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(separator)
    )
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

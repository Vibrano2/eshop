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

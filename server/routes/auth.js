import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';

const router = Router();

// Password hashing helper
function hashPassword(password, salt = null) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { salt: s, hash };
}

// Timing-safe password verification
function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Middleware to extract user from session token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Jeton d’authentification manquant.' });
  }

  try {
    const session = db.prepare(`
      SELECT * FROM sessions
      WHERE token = ? AND expires_at > datetime('now')
    `).get(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    }

    const user = db.prepare(`
      SELECT id, email, first_name, last_name, phone, shipping_address, postal_code, city, country_code, role, loyalty_code, created_at
      FROM users WHERE id = ?
    `).get(session.user_id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la vérification de session.' });
  }
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone = '',
      address = '',
      postalCode = '',
      city = '',
      countryCode = 'FR'
    } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Adresse e-mail invalide.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'Le prénom et le nom sont requis.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Cette adresse e-mail est déjà associée à un compte.' });
    }

    // Generate loyalty code & account with 50 welcome points
    const loyaltyCode = `ESHOP-EU${Math.floor(1000 + Math.random() * 9000)}`;
    const existingLoyalty = db.prepare('SELECT referral_code, points FROM loyalty_accounts WHERE email = ?').get(normalizedEmail);

    let activeLoyaltyCode = loyaltyCode;
    let points = 50;

    if (!existingLoyalty) {
      db.prepare(`
        INSERT INTO loyalty_accounts (referral_code, email, points, referrals_count, claimed_coupons_json, created_at)
        VALUES (?, ?, 50, 0, '[]', datetime('now'))
      `).run(loyaltyCode, normalizedEmail);

      db.prepare(`
        INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
        VALUES (?, ?, 'Cadeau de bienvenue', 50, 'credit', date('now'))
      `).run(`h-${Date.now()}`, loyaltyCode);
    } else {
      activeLoyaltyCode = existingLoyalty.referral_code;
      points = existingLoyalty.points;
    }

    // Hash password
    const { salt, hash } = hashPassword(password);

    // Insert user
    const insertUserStmt = db.prepare(`
      INSERT INTO users (
        email, password_hash, salt, first_name, last_name, phone,
        shipping_address, postal_code, city, country_code, role, loyalty_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'customer', ?, datetime('now'))
    `);

    const result = insertUserStmt.run(
      normalizedEmail,
      hash,
      salt,
      firstName.trim(),
      lastName.trim(),
      phone.trim(),
      address.trim(),
      postalCode.trim(),
      city.trim(),
      countryCode.toUpperCase(),
      activeLoyaltyCode
    );

    const userId = result.lastInsertRowid;

    // Create session token (30 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, datetime('now'), ?)
    `).run(token, userId, expiresAt);

    const userProfile = {
      id: userId,
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      countryCode: countryCode.toUpperCase(),
      role: 'customer',
      loyaltyCode: activeLoyaltyCode,
      loyaltyPoints: points
    };

    res.status(201).json({
      success: true,
      token,
      user: userProfile,
      message: 'Compte créé avec succès ! Vos 50 points fidélité de bienvenue ont été crédités.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Une erreur est survenue lors de l’inscription.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre email et votre mot de passe.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Adresse email ou mot de passe incorrect.' });
    }

    const isValid = verifyPassword(password, user.salt, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Adresse email ou mot de passe incorrect.' });
    }

    // Create session token (30 days)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, datetime('now'), ?)
    `).run(token, user.id, expiresAt);

    // Fetch loyalty points
    let points = 50;
    if (user.loyalty_code) {
      const loyalty = db.prepare('SELECT points FROM loyalty_accounts WHERE referral_code = ?').get(user.loyalty_code);
      if (loyalty) points = loyalty.points;
    }

    // Orders count
    const ordersCountRes = db.prepare('SELECT count(*) as count FROM orders WHERE customer_email = ?').get(user.email);

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || '',
      address: user.shipping_address || '',
      postalCode: user.postal_code || '',
      city: user.city || '',
      countryCode: user.country_code || 'FR',
      role: user.role,
      loyaltyCode: user.loyalty_code,
      loyaltyPoints: points,
      ordersCount: ordersCountRes ? ordersCountRes.count : 0
    };

    res.json({
      success: true,
      token,
      user: userProfile,
      message: `Ravi de vous revoir, ${user.first_name} !`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la connexion.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    // Fetch up-to-date loyalty points
    let points = 50;
    if (user.loyalty_code) {
      const loyalty = db.prepare('SELECT points FROM loyalty_accounts WHERE referral_code = ?').get(user.loyalty_code);
      if (loyalty) points = loyalty.points;
    }

    // Orders count
    const ordersCountRes = db.prepare('SELECT count(*) as count FROM orders WHERE customer_email = ?').get(user.email);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || '',
        address: user.shipping_address || '',
        postalCode: user.postal_code || '',
        city: user.city || '',
        countryCode: user.country_code || 'FR',
        role: user.role,
        loyaltyCode: user.loyalty_code,
        loyaltyPoints: points,
        ordersCount: ordersCountRes ? ordersCountRes.count : 0
      }
    });
  } catch (err) {
    console.error('Me endpoint error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du profil.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }

    res.json({ success: true, message: 'Déconnexion réussie.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la déconnexion.' });
  }
});

// GET /api/auth/orders
router.get('/orders', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE customer_email = ?
      ORDER BY created_at DESC
    `).all(user.email);

    const ordersWithItems = orders.map((order) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(order.order_number);
      let trackingSteps = [];
      try {
        trackingSteps = JSON.parse(order.tracking_steps_json || '[]');
      } catch {}

      return {
        orderNumber: order.order_number,
        date: order.created_at,
        customerEmail: order.customer_email,
        customerFirstName: order.customer_first_name,
        customerLastName: order.customer_last_name,
        shippingAddress: order.shipping_address,
        postalCode: order.postal_code,
        city: order.city,
        countryCode: order.country_code,
        subtotal: order.subtotal,
        discountAmount: order.discount_amount,
        shippingFee: order.shipping_fee,
        totalAmount: order.total_amount,
        carrier: order.carrier,
        estimatedDelivery: order.estimated_delivery,
        status: order.status,
        trackingSteps,
        items
      };
    });

    res.json({
      success: true,
      orders: ordersWithItems
    });
  } catch (err) {
    console.error('Fetch user orders error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des commandes.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, phone, address, postalCode, city, countryCode } = req.body;

    db.prepare(`
      UPDATE users
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          shipping_address = COALESCE(?, shipping_address),
          postal_code = COALESCE(?, postal_code),
          city = COALESCE(?, city),
          country_code = COALESCE(?, country_code)
      WHERE id = ?
    `).run(firstName, lastName, phone, address, postalCode, city, countryCode, user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone,
        address: updated.shipping_address,
        postalCode: updated.postal_code,
        city: updated.city,
        countryCode: updated.country_code,
        role: updated.role,
        loyaltyCode: updated.loyalty_code
      },
      message: 'Profil mis à jour avec succès.'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du profil.' });
  }
});

export default router;

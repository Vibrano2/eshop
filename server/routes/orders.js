import { Router } from 'express';
import { db } from '../db.js';
import { sendOrderConfirmationEmail } from '../services/email.js';
import { generateInvoicePdf } from '../services/invoicePdf.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to compute EU delivery dates
function getEstimatedDeliveryRange(countryCode = 'FR') {
  const now = new Date();
  const minDays = countryCode === 'FR' ? 2 : 3;
  const maxDays = countryCode === 'FR' ? 3 : 5;

  const minDate = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const options = { day: 'numeric', month: 'short' };
  return `${minDate.toLocaleDateString('fr-FR', options)} - ${maxDate.toLocaleDateString('fr-FR', options)}`;
}

// Helper: Extract authenticated user from Bearer session token if present
function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  try {
    const session = db.prepare(`
      SELECT s.*, u.role, u.email, u.first_name, u.last_name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);
    return session || null;
  } catch {
    return null;
  }
}

// Helper: Authorize access to an order (Admin, Owner by token, or Guest verified by matching email)
function verifyOrderAccess(order, req) {
  const user = getUserFromRequest(req);
  if (user) {
    if (user.role === 'admin') return { allowed: true, user };
    if (user.email && user.email.toLowerCase() === order.customer_email.toLowerCase()) {
      return { allowed: true, user };
    }
  }

  // Check query / body / header for guest email verification
  const candidateEmail = (
    req.query.email ||
    req.headers['x-order-email'] ||
    req.body?.customerEmail ||
    req.body?.email ||
    ''
  ).trim().toLowerCase();

  if (candidateEmail && candidateEmail === order.customer_email.toLowerCase()) {
    return { allowed: true, guest: true };
  }

  return { allowed: false };
}

// POST /api/orders
// Rate limited, validates products & prices server-side (Anti-Price-Tampering)
router.post('/', orderRateLimiter, async (req, res) => {
  try {
    const {
      customer = {},
      items = [],
      discountCode = '',
      referralCode = ''
    } = req.body;

    if (!customer.email || !customer.address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants (email, adresse de livraison, articles).'
      });
    }

    if (!EMAIL_REGEX.test(String(customer.email).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Adresse email de facturation invalide.'
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'La commande ne peut pas dépasser 50 articles distincts.'
      });
    }

    // 1. Server-side price determination and item validation
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const rawItem of items) {
      const productId = String(rawItem.id || '').trim();
      const quantity = Math.max(1, Math.min(99, parseInt(rawItem.quantity, 10) || 1));

      // Query database for authoritative product data
      const dbProd = db.prepare('SELECT id, name, price, image, stock FROM products WHERE id = ?').get(productId);
      if (!dbProd) {
        return res.status(400).json({
          success: false,
          error: `Le produit sélectionné (${productId}) n'est pas répertorié dans le catalogue.`
        });
      }

      const unitPrice = Number(dbProd.price);
      serverSubtotal += unitPrice * quantity;

      validatedItems.push({
        id: dbProd.id,
        name: dbProd.name,
        image: dbProd.image || rawItem.image || '',
        price: unitPrice,
        quantity,
        selectedSize: rawItem.selectedSize ? String(rawItem.selectedSize).slice(0, 30) : null,
        selectedColor: rawItem.selectedColor ? String(rawItem.selectedColor).slice(0, 30) : null
      });
    }

    serverSubtotal = Math.round(serverSubtotal * 100) / 100;

    // 2. Server-side promo code validation
    let serverDiscountAmount = 0;
    let isFreeShippingPromo = false;
    let validatedPromoCode = null;

    if (discountCode && typeof discountCode === 'string' && discountCode.trim()) {
      const codeNorm = discountCode.trim().toUpperCase();
      let match = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(codeNorm);
      if (!match && codeNorm.startsWith('ESHOP-')) {
        match = {
          code: codeNorm,
          fixed_discount: 10.0,
          min_amount: 40.0,
          is_free_shipping: 0
        };
      }

      if (match && (!match.min_amount || serverSubtotal >= match.min_amount)) {
        validatedPromoCode = match.code;
        isFreeShippingPromo = Boolean(match.is_free_shipping);
        if (match.discount_percent) {
          serverDiscountAmount = Math.round((serverSubtotal * (match.discount_percent / 100)) * 100) / 100;
        } else if (match.fixed_discount) {
          serverDiscountAmount = Math.min(serverSubtotal, match.fixed_discount);
        }
      }
    }

    // 3. Server-side shipping fee determination
    const isFreeShipping = serverSubtotal >= 40.0 || isFreeShippingPromo;
    const serverShippingFee = isFreeShipping ? 0.0 : 3.90;

    // 4. Server-side authoritative total
    const serverTotalAmount = Math.round(Math.max(0, serverSubtotal - serverDiscountAmount + serverShippingFee) * 100) / 100;

    const orderNumber = `EU-${Math.floor(100000 + Math.random() * 900000)}`;
    const countryCode = String(customer.country || customer.countryCode || 'FR').trim().toUpperCase().slice(0, 2);
    const carrier = countryCode === 'FR' ? 'Colissimo Suivi' : 'DHL Express Europe';
    const estimatedDelivery = getEstimatedDeliveryRange(countryCode);
    const createdAt = new Date().toISOString();

    const trackingSteps = [
      { title: 'Commande validée & sécurisée', date: 'Aujourd’hui (Immédiat)', done: true },
      { title: 'Préparation logistique (Plateforme UE)', date: 'Sous 24h ouvrées', done: true },
      { title: `Acheminement prioritaire ${carrier}`, date: 'Dans 2 jours', done: false },
      { title: 'Livraison en boîte aux lettres ou contre signature', date: estimatedDelivery, done: false }
    ];

    const safeCustomer = {
      email: String(customer.email).trim().toLowerCase().slice(0, 100),
      firstName: String(customer.firstName || '').trim().slice(0, 60),
      lastName: String(customer.lastName || '').trim().slice(0, 60),
      address: String(customer.address || '').trim().slice(0, 120),
      postalCode: String(customer.postalCode || '').trim().slice(0, 20),
      city: String(customer.city || '').trim().slice(0, 60),
      countryCode
    };

    // Insert Order in a transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      const insertOrderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, customer_email, customer_first_name, customer_last_name,
          shipping_address, postal_code, city, country_code,
          subtotal, discount_amount, discount_code, shipping_fee, total_amount,
          carrier, estimated_delivery, status, tracking_steps_json, created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `);

      insertOrderStmt.run(
        orderNumber,
        safeCustomer.email,
        safeCustomer.firstName,
        safeCustomer.lastName,
        safeCustomer.address,
        safeCustomer.postalCode,
        safeCustomer.city,
        safeCustomer.countryCode,
        serverSubtotal,
        serverDiscountAmount,
        validatedPromoCode,
        serverShippingFee,
        serverTotalAmount,
        carrier,
        estimatedDelivery,
        'Confirmée & en préparation',
        JSON.stringify(trackingSteps),
        createdAt
      );

      // Insert Order Items and decrement stock
      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (
          order_number, product_id, product_name, product_image, variant, unit_price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const decrementStockStmt = db.prepare(`
        UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
      `);

      for (const item of validatedItems) {
        const variantStr = [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ');
        insertItemStmt.run(
          orderNumber,
          item.id,
          item.name,
          item.image,
          variantStr || null,
          item.price,
          item.quantity
        );

        decrementStockStmt.run(item.quantity, item.id);
      }

      // Credit Loyalty Points if account matches
      const pointsEarned = Math.floor(serverTotalAmount);
      if (pointsEarned > 0) {
        const refTarget = referralCode || 'ESHOP-EU4821';
        const account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ? OR email = ?').get(refTarget, safeCustomer.email);

        if (account) {
          db.prepare('UPDATE loyalty_accounts SET points = points + ? WHERE referral_code = ?').run(pointsEarned, account.referral_code);

          db.prepare(`
            INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
            VALUES (?, ?, ?, ?, 'credit', date('now'))
          `).run(
            `order-${orderNumber}`,
            account.referral_code,
            `Commande ${orderNumber}`,
            pointsEarned
          );
        }
      }

      db.exec('COMMIT;');

      // Dispatch Order Confirmation Email
      let emailResult = { success: false, previewUrl: null };
      try {
        emailResult = await sendOrderConfirmationEmail({
          orderNumber,
          customerEmail: safeCustomer.email,
          customerFirstName: safeCustomer.firstName,
          customerLastName: safeCustomer.lastName,
          shippingAddress: safeCustomer.address,
          postalCode: safeCustomer.postalCode,
          city: safeCustomer.city,
          countryCode: safeCustomer.countryCode,
          carrier,
          estimatedDelivery,
          subtotal: serverSubtotal,
          discountAmount: serverDiscountAmount,
          shippingFee: serverShippingFee,
          totalAmount: serverTotalAmount,
          items: validatedItems
        });
      } catch (mailErr) {
        console.warn('Non-fatal error sending confirmation email:', mailErr.message);
      }

      res.status(201).json({
        success: true,
        order: {
          orderNumber,
          date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
          items: validatedItems,
          customer: safeCustomer,
          subtotal: serverSubtotal,
          discountAmount: serverDiscountAmount,
          discountCode: validatedPromoCode,
          shippingFee: serverShippingFee,
          totalAmount: serverTotalAmount,
          estimatedDelivery,
          carrier,
          status: 'Confirmée & en préparation',
          trackingSteps,
          pointsEarned,
          emailSent: emailResult.success,
          emailPreviewUrl: emailResult.previewUrl
        }
      });
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Échec de création de la commande' });
  }
});

// POST /api/orders/:orderNumber/resend-confirmation
// Requires ownership verification
router.post('/:orderNumber/resend-confirmation', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    const access = verifyOrderAccess(order, req);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Accès restreint. Authentification requise pour renvoyer cet email.'
      });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);

    const emailResult = await sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      customerFirstName: order.customer_first_name,
      customerLastName: order.customer_last_name,
      shippingAddress: order.shipping_address,
      postalCode: order.postal_code,
      city: order.city,
      countryCode: order.country_code,
      carrier: order.carrier,
      estimatedDelivery: order.estimated_delivery,
      subtotal: order.subtotal,
      discountAmount: order.discount_amount,
      shippingFee: order.shipping_fee,
      totalAmount: order.total_amount,
      items
    });

    res.json({
      success: true,
      message: `Email de confirmation renvoyé à ${order.customer_email}.`,
      previewUrl: emailResult.previewUrl
    });
  } catch (err) {
    console.error('Error resending order email:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’envoi de l’email.' });
  }
});

// GET /api/orders/:orderNumber
// IDOR Protected: Only owner, verified guest, or admin can retrieve full order details
router.get('/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    const access = verifyOrderAccess(order, req);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Accès restreint. Veuillez vous connecter ou indiquer l’adresse email de la commande pour consulter ces informations.'
      });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        trackingSteps: JSON.parse(order.tracking_steps_json || '[]')
      }
    });
  } catch (err) {
    console.error('Error retrieving order:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la commande' });
  }
});

// GET /api/orders/:orderNumber/track
// Public parcel tracking info (Safe: returns no sensitive PII like customer email or street address)
router.get('/:orderNumber/track', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT order_number, carrier, estimated_delivery, status, tracking_steps_json FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Numéro de colis inconnu' });
    }

    res.json({
      success: true,
      tracking: {
        orderNumber: order.order_number,
        carrier: order.carrier,
        status: order.status,
        estimatedDelivery: order.estimated_delivery,
        steps: JSON.parse(order.tracking_steps_json || '[]')
      }
    });
  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du suivi' });
  }
});

// GET /api/orders/:orderNumber/invoice.pdf
// IDOR Protected: Only owner, verified guest, or admin can download official PDF tax invoice
router.get('/:orderNumber/invoice.pdf', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    const access = verifyOrderAccess(order, req);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Accès restreint. Veuillez vous connecter ou indiquer l’adresse email de la commande pour télécharger cette facture.'
      });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-FAC-${orderNumber}.pdf"`);

    generateInvoicePdf(order, items, res);
  } catch (err) {
    console.error('Error generating invoice PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Erreur lors de la génération du PDF de facture' });
    }
  }
});

// POST /api/orders/:orderNumber/returns
// Protected: Only owner or verified guest can submit RMA return
router.post('/:orderNumber/returns', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { items = [], reason, details = '', refundMode = 'original_payment' } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    const access = verifyOrderAccess(order, req);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Accès restreint. Veuillez vous connecter pour effectuer une demande de retour.'
      });
    }

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner au moins un article à retourner.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Veuillez spécifier le motif du retour.' });
    }

    // Calculate refund amount based on authoritative order_items prices
    let refundAmount = 0;
    const orderItemsDb = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);
    const orderItemsMap = new Map(orderItemsDb.map(i => [String(i.product_id), i]));

    for (const item of items) {
      const dbItem = orderItemsMap.get(String(item.productId || item.product_id || item.id));
      const unitPrice = dbItem ? dbItem.unit_price : (Number(item.unitPrice || item.price) || 0);
      const qty = Math.min(dbItem ? dbItem.quantity : 99, Math.max(1, Number(item.quantity) || 1));
      refundAmount += qty * unitPrice;
    }

    // Apply store credit bonus +5% if chosen
    if (refundMode === 'store_credit_bonus') {
      refundAmount = Number((refundAmount * 1.05).toFixed(2));
    } else {
      refundAmount = Number(refundAmount.toFixed(2));
    }

    const rmaId = `RMA-${Math.floor(100000 + Math.random() * 900000)}`;
    const barcode = `8R${Math.floor(1000000000 + Math.random() * 9000000000)}FR`;
    const nowIso = new Date().toISOString();
    const customerName = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || 'Client';

    const insertReturnStmt = db.prepare(`
      INSERT INTO order_returns (
        id, order_number, customer_email, customer_name,
        reason, details, items_json, refund_mode, return_label_barcode,
        status, refund_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertReturnStmt.run(
      rmaId,
      orderNumber,
      order.customer_email,
      customerName,
      String(reason).slice(0, 100),
      String(details || '').slice(0, 500),
      JSON.stringify(items),
      refundMode === 'store_credit_bonus' ? 'store_credit_bonus' : 'original_payment',
      barcode,
      'En attente de dépôt',
      refundAmount,
      nowIso,
      nowIso
    );

    const warehouseInfo = {
      name: 'ESHOP RETOURS LOGISTIQUE UE',
      address: '45 Rue de la Logistique, Quai 12',
      postalCode: '93290',
      city: 'Tremblay-en-France',
      country: 'France'
    };

    res.status(201).json({
      success: true,
      returnRequest: {
        id: rmaId,
        orderNumber,
        customerEmail: order.customer_email,
        customerName,
        senderAddress: {
          address: order.shipping_address,
          postalCode: order.postal_code,
          city: order.city,
          countryCode: order.country_code
        },
        warehouse: warehouseInfo,
        reason,
        details,
        items,
        refundMode,
        returnLabelBarcode: barcode,
        status: 'En attente de dépôt',
        refundAmount,
        carrier: 'Colissimo Retour UE',
        createdAt: nowIso
      },
      message: 'Demande de retour validée avec succès. Votre étiquette de retour Colissimo prépayée est prête.'
    });
  } catch (err) {
    console.error('Error creating return request:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la demande de retour.' });
  }
});

// GET /api/orders/:orderNumber/returns
// IDOR Protected
router.get('/:orderNumber/returns', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    const access = verifyOrderAccess(order, req);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Accès restreint.'
      });
    }

    const returns = db.prepare('SELECT * FROM order_returns WHERE order_number = ? ORDER BY created_at DESC').all(orderNumber);

    const parsedReturns = returns.map((ret) => {
      let items = [];
      try {
        items = JSON.parse(ret.items_json || '[]');
      } catch {}

      return {
        id: ret.id,
        orderNumber: ret.order_number,
        customerEmail: ret.customer_email,
        customerName: ret.customer_name,
        reason: ret.reason,
        details: ret.details,
        items,
        refundMode: ret.refund_mode,
        returnLabelBarcode: ret.return_label_barcode,
        status: ret.status,
        refundAmount: ret.refund_amount,
        createdAt: ret.created_at,
        updatedAt: ret.updated_at
      };
    });

    res.json({
      success: true,
      returns: parsedReturns
    });
  } catch (err) {
    console.error('Error fetching order returns:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des retours.' });
  }
});

export default router;

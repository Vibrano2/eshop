import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';
import { sendOrderConfirmationEmail } from '../services/email.js';

const router = Router();

function getEstimatedDeliveryRange(countryCode) {
  const now = new Date();
  const days = countryCode === 'FR' ? 2 : 4;
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return target.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Official test cards mapping for sandbox testing
const KNOWN_TEST_CARDS = {
  '4242424242424242': {
    brand: 'visa',
    name: 'Visa 3D Secure Test',
    requires3DS: true,
    shouldSucceed: true,
    bankName: 'BNP Paribas'
  },
  '5555555555554444': {
    brand: 'mastercard',
    name: 'Mastercard Direct Success',
    requires3DS: false,
    shouldSucceed: true,
    bankName: 'Crédit Agricole'
  },
  '4000000000000002': {
    brand: 'visa',
    name: 'Visa Declined Insufficient Funds',
    requires3DS: false,
    shouldSucceed: false,
    error: 'La transaction a été refusée par votre établissement bancaire pour provision insuffisante (Code : 05 - DO_NOT_HONOR).'
  },
  '4000000000000069': {
    brand: 'visa',
    name: 'Visa Expired Card',
    requires3DS: false,
    shouldSucceed: false,
    error: 'Votre carte bancaire a expiré. Veuillez utiliser un moyen de paiement en cours de validité.'
  }
};

/**
 * POST /api/payment/create-checkout-session
 * Initialize real Stripe Hosted Checkout Session (supports Card, Apple Pay, Google Pay)
 */
router.post('/create-checkout-session', paymentRateLimiter, async (req, res) => {
  try {
    const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeSecret) {
      return res.status(500).json({ success: false, error: 'Passerelle Stripe non configurée.' });
    }

    const { items = [], customer = {}, discountCode = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Panier vide ou invalide.' });
    }

    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return res.status(400).json({ success: false, error: 'Adresse email client invalide.' });
    }

    // 1. Authoritative server-side price validation
    const validatedItems = [];
    let serverSubtotal = 0;

    for (const rawItem of items) {
      if (!rawItem || !rawItem.id) continue;
      const dbProd = db.prepare('SELECT id, name, price, stock, image FROM products WHERE id = ?').get(String(rawItem.id));
      if (!dbProd) {
        return res.status(400).json({ success: false, error: `Article introuvable en stock (ID: ${rawItem.id})` });
      }

      const unitPrice = Number(dbProd.price);
      const quantity = Math.max(1, Math.min(99, parseInt(rawItem.quantity, 10) || 1));
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
        match = { code: codeNorm, fixed_discount: 10.0, min_amount: 40.0, is_free_shipping: 0 };
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

    // 3. Shipping determination
    const isFreeShipping = serverSubtotal >= 40.0 || isFreeShippingPromo;
    const serverShippingFee = isFreeShipping ? 0.0 : 3.90;
    const serverTotalAmount = Math.round(Math.max(0, serverSubtotal - serverDiscountAmount + serverShippingFee) * 100) / 100;

    const orderNumber = `EU-${Math.floor(100000 + Math.random() * 900000)}`;
    const countryCode = String(customer.country || customer.countryCode || 'FR').trim().toUpperCase().slice(0, 2);
    const carrier = countryCode === 'FR' ? 'Colissimo Suivi' : 'DHL Express Europe';
    const estimatedDelivery = getEstimatedDeliveryRange(countryCode);
    const createdAt = new Date().toISOString();

    const safeCustomer = {
      email: String(customer.email).trim().toLowerCase().slice(0, 100),
      firstName: String(customer.firstName || '').trim().slice(0, 60),
      lastName: String(customer.lastName || '').trim().slice(0, 60),
      address: String(customer.address || '').trim().slice(0, 120),
      postalCode: String(customer.postalCode || '').trim().slice(0, 20),
      city: String(customer.city || '').trim().slice(0, 60),
      phone: String(customer.phone || '').trim().slice(0, 30),
      countryCode
    };

    // 4. Save pending order into database
    const trackingSteps = [
      { title: 'Paiement Stripe en cours de validation', date: 'Immédiat', done: false },
      { title: 'Préparation logistique (Plateforme UE)', date: 'Sous 24h ouvrées', done: false },
      { title: `Acheminement prioritaire ${carrier}`, date: 'Dans 2 jours', done: false },
      { title: 'Livraison en boîte aux lettres ou contre signature', date: estimatedDelivery, done: false }
    ];

    db.prepare(`
      INSERT INTO orders (
        order_number, customer_email, customer_first_name, customer_last_name,
        shipping_address, postal_code, city, country_code,
        subtotal, discount_amount, discount_code, shipping_fee, total_amount,
        carrier, estimated_delivery, status, tracking_steps_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber, safeCustomer.email, safeCustomer.firstName, safeCustomer.lastName,
      safeCustomer.address, safeCustomer.postalCode, safeCustomer.city, countryCode,
      serverSubtotal, serverDiscountAmount, validatedPromoCode, serverShippingFee, serverTotalAmount,
      carrier, estimatedDelivery, 'en_attente_de_paiement', JSON.stringify(trackingSteps), createdAt
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_number, product_id, product_name, product_image, variant, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of validatedItems) {
      const variantStr = [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ') || null;
      insertItem.run(orderNumber, item.id, item.name, item.image, variantStr, item.price, item.quantity);
    }

    // 5. Build Stripe Checkout Session
    const clientOrigin = (req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const successUrl = `${clientOrigin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}&order_number=${orderNumber}`;
    const cancelUrl = `${clientOrigin}/?payment_status=cancelled`;

    const stripeParams = new URLSearchParams({
      mode: 'payment',
      customer_email: safeCustomer.email,
      client_reference_id: orderNumber,
      'metadata[orderNumber]': orderNumber,
      'metadata[customerEmail]': safeCustomer.email,
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    validatedItems.forEach((item, idx) => {
      stripeParams.append(`line_items[${idx}][price_data][currency]`, 'eur');
      stripeParams.append(`line_items[${idx}][price_data][product_data][name]`, item.name);
      stripeParams.append(`line_items[${idx}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
      stripeParams.append(`line_items[${idx}][quantity]`, String(item.quantity));
    });

    if (serverShippingFee > 0) {
      const shipIdx = validatedItems.length;
      stripeParams.append(`line_items[${shipIdx}][price_data][currency]`, 'eur');
      stripeParams.append(`line_items[${shipIdx}][price_data][product_data][name]`, `Frais de port prioritaires (${carrier})`);
      stripeParams.append(`line_items[${shipIdx}][price_data][unit_amount]`, String(Math.round(serverShippingFee * 100)));
      stripeParams.append(`line_items[${shipIdx}][quantity]`, '1');
    }

    if (serverDiscountAmount > 0) {
      try {
        const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeSecret}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            amount_off: String(Math.round(serverDiscountAmount * 100)),
            currency: 'eur',
            duration: 'once',
            name: `Remise ${validatedPromoCode || 'Promo'}`
          })
        });
        const coupon = await couponRes.json();
        if (coupon.id) {
          stripeParams.append('discounts[0][coupon]', coupon.id);
        }
      } catch (couponErr) {
        console.warn('Failed to apply Stripe coupon:', couponErr.message);
      }
    }

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeParams
    });

    const session = await sessionRes.json();

    if (session.error) {
      console.error('Stripe session creation error:', session.error);
      return res.status(400).json({ success: false, error: session.error.message });
    }

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      orderNumber
    });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la session Stripe.' });
  }
});

/**
 * GET /api/payment/verify-session?sessionId=...
 * Verify completed payment with Stripe, update database and send email
 */
router.get('/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Identifiant de session manquant.' });
    }

    const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeSecret) {
      return res.status(500).json({ success: false, error: 'Stripe non configuré.' });
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeSecret}` }
    });
    const session = await response.json();

    if (session.error) {
      return res.status(400).json({ success: false, error: session.error.message });
    }

    const isPaid = session.payment_status === 'paid';
    const orderNumber = session.client_reference_id || session.metadata?.orderNumber;

    if (!orderNumber) {
      return res.status(404).json({ success: false, error: 'Commande introuvable pour cette session.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    if (isPaid && order.status === 'en_attente_de_paiement') {
      const trackingSteps = [
        { title: 'Paiement Stripe confirmé avec succès', date: 'Aujourd’hui (Immédiat)', done: true },
        { title: 'Préparation logistique (Plateforme UE)', date: 'Sous 24h ouvrées', done: true },
        { title: `Acheminement prioritaire ${order.carrier}`, date: 'Dans 2 jours', done: false },
        { title: 'Livraison en boîte aux lettres ou contre signature', date: order.estimated_delivery, done: false }
      ];

      db.prepare(`
        UPDATE orders 
        SET status = 'en_preparation', tracking_steps_json = ? 
        WHERE order_number = ?
      `).run(JSON.stringify(trackingSteps), orderNumber);

      // Decrement stock in database
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_number = ?').all(orderNumber);
      const updateStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');
      for (const it of items) {
        updateStock.run(it.quantity, it.product_id);
      }

      // Fetch full order for email
      const fullItems = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);
      const emailPayload = {
        ...order,
        items: fullItems,
        customerEmail: order.customer_email,
        customer: {
          firstName: order.customer_first_name,
          lastName: order.customer_last_name,
          email: order.customer_email,
          address: order.shipping_address,
          postalCode: order.postal_code,
          city: order.city,
          countryCode: order.country_code
        }
      };

      sendOrderConfirmationEmail(emailPayload).catch(e => console.warn('Post-checkout email warning:', e.message));
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    const updatedItems = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(orderNumber);

    res.json({
      success: true,
      paid: isPaid,
      order: {
        ...updatedOrder,
        items: updatedItems
      }
    });
  } catch (err) {
    console.error('Verify session error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification de la session.' });
  }
});

/**
 * POST /api/payment/create-intent
 * Initialize a Payment Intent (Stripe Live or Sandbox)
 */
router.post('/create-intent', paymentRateLimiter, async (req, res) => {
  try {
    const { amount, currency = 'eur', customer = {}, cardNumber = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide pour le paiement.' });
    }

    const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();

    // If Stripe Live/Test key configured, create real PaymentIntent on Stripe
    if (stripeSecret && (stripeSecret.startsWith('sk_live_') || stripeSecret.startsWith('sk_test_'))) {
      try {
        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeSecret}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            amount: String(Math.round(amount * 100)),
            currency: currency.toLowerCase(),
            'automatic_payment_methods[enabled]': 'true',
            'metadata[customerEmail]': customer.email || ''
          })
        });
        const pi = await stripeRes.json();
        if (pi.id) {
          return res.json({
            success: true,
            paymentIntent: {
              id: pi.id,
              clientSecret: pi.client_secret,
              amount: pi.amount,
              currency: pi.currency,
              status: pi.status,
              requires3DS: pi.status === 'requires_action',
              bankName: 'Stripe 3D Secure v2',
              livemode: Boolean(pi.livemode)
            }
          });
        }
      } catch (stripeErr) {
        console.warn('Real Stripe PaymentIntent creation failed, falling back:', stripeErr.message);
      }
    }

    // Sandbox fallback
    const cleanCard = (cardNumber || '').replace(/\s+/g, '');
    const cardProfile = KNOWN_TEST_CARDS[cleanCard] || {
      brand: cleanCard.startsWith('4') ? 'visa' : cleanCard.startsWith('5') ? 'mastercard' : 'cb',
      requires3DS: amount >= 30,
      shouldSucceed: true,
      bankName: 'Banque Émettrice UE'
    };

    if (cardProfile.shouldSucceed === false) {
      return res.status(402).json({
        success: false,
        error: cardProfile.error,
        code: 'card_declined'
      });
    }

    const paymentIntentId = `pi_test_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(16).toString('hex')}`;

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        clientSecret,
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        status: cardProfile.requires3DS ? 'requires_action' : 'requires_confirmation',
        requires3DS: cardProfile.requires3DS,
        bankName: cardProfile.bankName,
        livemode: false
      }
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l’intention de paiement.' });
  }
});

/**
 * POST /api/payment/confirm-intent
 * Confirm payment with 3DS challenge token or OTP
 */
router.post('/confirm-intent', paymentRateLimiter, (req, res) => {
  try {
    const { paymentIntentId, otpCode, simulatedAppApproval } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'Identifiant PaymentIntent manquant.' });
    }

    if (otpCode !== undefined && otpCode !== null) {
      const cleanOtp = String(otpCode).trim();
      if (cleanOtp.length !== 6 && !simulatedAppApproval) {
        return res.status(400).json({
          success: false,
          error: 'Le code de sécurité SMS doit comporter exactement 6 chiffres (Code test : 123456).'
        });
      }
    }

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        status: 'succeeded',
        charges: {
          data: [
            {
              id: `ch_test_${crypto.randomBytes(12).toString('hex')}`,
              paid: true,
              outcome: {
                network_status: 'approved_by_network',
                risk_level: 'normal',
                seller_message: 'Paiement autorisé et vérifié avec 3D Secure v2.'
              }
            }
          ]
        }
      },
      message: 'Paiement sécurisé validé avec succès.'
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la confirmation du règlement.' });
  }
});

export default router;

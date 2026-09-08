import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

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

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const {
      customer = {},
      items = [],
      subtotal = 0,
      discountAmount = 0,
      discountCode = '',
      shippingFee = 0,
      totalAmount = 0,
      referralCode = ''
    } = req.body;

    if (!customer.email || !customer.address || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants (email, adresse de livraison, articles).'
      });
    }

    const orderNumber = `EU-${Math.floor(100000 + Math.random() * 900000)}`;
    const countryCode = (customer.country || customer.countryCode || 'FR').toUpperCase();
    const carrier = countryCode === 'FR' ? 'Colissimo Suivi' : 'DHL Express Europe';
    const estimatedDelivery = getEstimatedDeliveryRange(countryCode);
    const createdAt = new Date().toISOString();

    const trackingSteps = [
      { title: 'Commande validée & sécurisée', date: 'Aujourd’hui (Immédiat)', done: true },
      { title: 'Préparation logistique (Plateforme UE)', date: 'Sous 24h ouvrées', done: true },
      { title: `Acheminement prioritaire ${carrier}`, date: 'Dans 2 jours', done: false },
      { title: 'Livraison en boîte aux lettres ou contre signature', date: estimatedDelivery, done: false }
    ];

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
        customer.email,
        customer.firstName || '',
        customer.lastName || '',
        customer.address,
        customer.postalCode || '',
        customer.city || '',
        countryCode,
        Number(subtotal) || 0,
        Number(discountAmount) || 0,
        discountCode || null,
        Number(shippingFee) || 0,
        Number(totalAmount) || 0,
        carrier,
        estimatedDelivery,
        'Confirmée & en préparation',
        JSON.stringify(trackingSteps),
        createdAt
      );

      // Insert Order Items
      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (
          order_number, product_id, product_name, product_image, variant, unit_price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const variantStr = [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ');
        insertItemStmt.run(
          orderNumber,
          item.id || 'N/A',
          item.name || 'Article',
          item.image || '',
          variantStr || null,
          Number(item.price) || 0,
          Number(item.quantity) || 1
        );
      }

      // Credit Loyalty Points if account matches
      const pointsEarned = Math.floor(totalAmount);
      if (pointsEarned > 0) {
        const refTarget = referralCode || 'ESHOP-EU4821';
        const account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ? OR email = ?').get(refTarget, customer.email);

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

      res.status(201).json({
        success: true,
        order: {
          orderNumber,
          date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
          items,
          customer,
          subtotal,
          discountAmount,
          discountCode,
          shippingFee,
          totalAmount,
          estimatedDelivery,
          carrier,
          status: 'Confirmée & en préparation',
          trackingSteps,
          pointsEarned
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

// GET /api/orders/:orderNumber
router.get('/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
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

export default router;

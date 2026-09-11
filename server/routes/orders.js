import { Router } from 'express';
import { db } from '../db.js';
import { sendOrderConfirmationEmail } from '../services/email.js';
import { generateInvoicePdf } from '../services/invoicePdf.js';

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
router.post('/', async (req, res) => {
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

      // Dispatch Order Confirmation Email
      let emailResult = { success: false, previewUrl: null };
      try {
        emailResult = await sendOrderConfirmationEmail({
          orderNumber,
          customerEmail: customer.email,
          customerFirstName: customer.firstName || '',
          customerLastName: customer.lastName || '',
          shippingAddress: customer.address,
          postalCode: customer.postalCode || '',
          city: customer.city || '',
          countryCode,
          carrier,
          estimatedDelivery,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          items
        });
      } catch (mailErr) {
        console.warn('Non-fatal error sending confirmation email:', mailErr.message);
      }

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
router.post('/:orderNumber/resend-confirmation', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
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

// GET /api/orders/:orderNumber/invoice.pdf
router.get('/:orderNumber/invoice.pdf', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
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
router.post('/:orderNumber/returns', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { items = [], reason, details = '', refundMode = 'original_payment' } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner au moins un article à retourner.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Veuillez spécifier le motif du retour.' });
    }

    // Calculate refund amount
    let refundAmount = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice || item.price || item.unit_price) || 0;
      refundAmount += qty * price;
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
      reason,
      details,
      JSON.stringify(items),
      refundMode,
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
router.get('/:orderNumber/returns', (req, res) => {
  try {
    const { orderNumber } = req.params;
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


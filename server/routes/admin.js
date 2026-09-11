import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Middleware: Require Authenticated Admin
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Accès non autorisé : jeton manquant.' });
  }

  try {
    const session = db.prepare(`
      SELECT s.*, u.role, u.email, u.first_name, u.last_name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
    }

    if (session.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit : privilèges administrateur requis.' });
    }

    req.user = session;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(500).json({ success: false, error: 'Erreur d’authentification administrateur.' });
  }
}

// Apply admin guard to all routes in this router
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalRevRow = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'Annulée'`).get();
    const todayRevRow = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE date(created_at) = date('now') AND status != 'Annulée'`).get();
    const ordersCountRow = db.prepare(`SELECT COUNT(*) as count FROM orders`).get();
    const customersCountRow = db.prepare(`SELECT COUNT(*) as count FROM users`).get();
    const subscribersCountRow = db.prepare(`SELECT COUNT(*) as count FROM newsletter`).get();
    const lowStockRow = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock < 10`).get();

    const ordersCount = ordersCountRow.count || 0;
    const totalRevenue = Number(totalRevRow.total.toFixed(2));
    const todayRevenue = Number(todayRevRow.total.toFixed(2));
    const averageCart = ordersCount > 0 ? Number((totalRevenue / ordersCount).toFixed(2)) : 0;

    // Status breakdown
    const statusRows = db.prepare(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`).all();
    const statusBreakdown = {};
    for (const row of statusRows) {
      statusBreakdown[row.status] = row.count;
    }

    // Top selling categories
    const categorySalesRows = db.prepare(`
      SELECT p.category, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.category
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    // 5 Latest Orders
    const recentOrders = db.prepare(`
      SELECT order_number, customer_first_name, customer_last_name, customer_email, total_amount, status, carrier, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        totalRevenue,
        todayRevenue,
        ordersCount,
        averageCart,
        customersCount: customersCountRow.count || 0,
        subscribersCount: subscribersCountRow.count || 0,
        lowStockCount: lowStockRow.count || 0,
        statusBreakdown,
        categorySales: categorySalesRows,
        recentOrders
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du calcul des indicateurs.' });
  }
});

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  try {
    const { status, q, limit = 50 } = req.query;
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (q) {
      query += ` AND (order_number LIKE ? OR customer_email LIKE ? OR customer_last_name LIKE ?)`;
      const search = `%${q.trim()}%`;
      params.push(search, search, search);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit) || 50);

    const orders = db.prepare(query).all(...params);

    const fullOrders = orders.map((o) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_number = ?').all(o.order_number);
      let steps = [];
      try {
        steps = JSON.parse(o.tracking_steps_json || '[]');
      } catch {}

      return {
        orderNumber: o.order_number,
        date: o.created_at,
        customerEmail: o.customer_email,
        firstName: o.customer_first_name,
        lastName: o.customer_last_name,
        shippingAddress: o.shipping_address,
        postalCode: o.postal_code,
        city: o.city,
        countryCode: o.country_code,
        subtotal: o.subtotal,
        discountAmount: o.discount_amount,
        shippingFee: o.shipping_fee,
        totalAmount: o.total_amount,
        carrier: o.carrier,
        estimatedDelivery: o.estimated_delivery,
        status: o.status,
        steps,
        items
      };
    });

    res.json({
      success: true,
      orders: fullOrders,
      total: fullOrders.length
    });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des commandes.' });
  }
});

// PATCH /api/admin/orders/:orderNumber/status
router.patch('/orders/:orderNumber/status', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, carrier, trackingNumber, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Le nouveau statut est requis.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    let steps = [];
    try {
      steps = JSON.parse(order.tracking_steps_json || '[]');
    } catch {}

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Update tracking steps based on status
    if (status === 'Expédiée') {
      const stepTitle = trackingNumber
        ? `Expédiée via ${carrier || order.carrier} (N° ${trackingNumber})`
        : `Colis expédié et remis à ${carrier || order.carrier}`;

      steps = steps.map((s) => (s.title.includes('Préparation') || s.title.includes('confirmée') ? { ...s, completed: true } : s));
      steps.push({
        title: stepTitle,
        date: nowFormatted,
        completed: true
      });
    } else if (status === 'En cours de livraison') {
      steps.push({
        title: `En cours d'acheminement / Livraison finale aujourd'hui`,
        date: nowFormatted,
        completed: true
      });
    } else if (status === 'Livrée') {
      steps = steps.map((s) => ({ ...s, completed: true }));
      steps.push({
        title: `Colis livré et réceptionné avec succès`,
        date: nowFormatted,
        completed: true
      });
    } else if (status === 'Annulée') {
      steps.push({
        title: `Commande annulée ${note ? `(${note})` : ''}`,
        date: nowFormatted,
        completed: false
      });
    }

    db.prepare(`
      UPDATE orders
      SET status = ?,
          carrier = COALESCE(?, carrier),
          tracking_steps_json = ?
      WHERE order_number = ?
    `).run(status, carrier || null, JSON.stringify(steps), orderNumber);

    const updated = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);

    res.json({
      success: true,
      order: {
        orderNumber: updated.order_number,
        status: updated.status,
        carrier: updated.carrier,
        steps
      },
      message: `Statut de la commande ${orderNumber} mis à jour : "${status}".`
    });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// GET /api/admin/products
router.get('/products', (req, res) => {
  try {
    const { category, q, stockFilter } = req.query;
    let query = `SELECT id, sku, name, category, subcategory, price, stock, rating, reviews_count, image, is_best_seller, is_new FROM products WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (q) {
      query += ` AND (name LIKE ? OR sku LIKE ?)`;
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (stockFilter === 'low') {
      query += ` AND stock < 10 AND stock > 0`;
    } else if (stockFilter === 'out') {
      query += ` AND stock <= 0`;
    }

    query += ` ORDER BY stock ASC, name ASC`;

    const products = db.prepare(query).all(...params);

    res.json({
      success: true,
      products,
      total: products.length
    });
  } catch (err) {
    console.error('Admin products fetch error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des produits.' });
  }
});

// PATCH /api/admin/products/:id/stock
router.patch('/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;

    const prod = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Produit introuvable.' });
    }

    let newStock = prod.stock;
    if (typeof stock === 'number') {
      newStock = Math.max(0, stock);
    } else if (typeof delta === 'number') {
      newStock = Math.max(0, prod.stock + delta);
    }

    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(newStock, id);

    res.json({
      success: true,
      id,
      name: prod.name,
      stock: newStock,
      message: `Stock du produit "${prod.name}" mis à jour : ${newStock} unités.`
    });
  } catch (err) {
    console.error('Admin stock update error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la modification du stock.' });
  }
});

// GET /api/admin/subscribers
router.get('/subscribers', (req, res) => {
  try {
    const subscribers = db.prepare(`
      SELECT email, promo_code, created_at
      FROM newsletter
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      subscribers,
      total: subscribers.length
    });
  } catch (err) {
    console.error('Admin subscribers fetch error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des abonnés.' });
  }
});

// GET /api/admin/returns
router.get('/returns', (req, res) => {
  try {
    const { status, q } = req.query;
    let sql = 'SELECT * FROM order_returns WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (q) {
      sql += ' AND (id LIKE ? OR order_number LIKE ? OR customer_email LIKE ? OR customer_name LIKE ?)';
      const search = `%${q.trim()}%`;
      params.push(search, search, search, search);
    }

    sql += ' ORDER BY created_at DESC';

    const returns = db.prepare(sql).all(...params);

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
      returns: parsedReturns,
      total: parsedReturns.length
    });
  } catch (err) {
    console.error('Admin returns fetch error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des retours.' });
  }
});

// PATCH /api/admin/returns/:rmaId/status
router.patch('/returns/:rmaId/status', (req, res) => {
  try {
    const { rmaId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Nouveau statut manquant.' });
    }

    const ret = db.prepare('SELECT * FROM order_returns WHERE id = ?').get(rmaId);
    if (!ret) {
      return res.status(404).json({ success: false, error: 'Dossier de retour introuvable.' });
    }

    const nowIso = new Date().toISOString();
    db.prepare('UPDATE order_returns SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso, rmaId);

    res.json({
      success: true,
      rmaId,
      status,
      updatedAt: nowIso,
      message: `Le dossier ${rmaId} est passé au statut "${status}".`
    });
  } catch (err) {
    console.error('Admin update return status error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du statut du retour.' });
  }
});

export default router;

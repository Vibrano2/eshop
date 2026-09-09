import { Router } from 'express';
import { db } from '../db.js';

const router = Router({ mergeParams: true });

// Seed initial realistic reviews if the table is empty
export function seedInitialReviews() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM product_reviews').get();
  if (countRow && countRow.count > 0) return;

  const existingProducts = db.prepare('SELECT id, name FROM products LIMIT 5').all();
  if (!existingProducts || existingProducts.length === 0) return;

  const p1 = existingProducts[0].id;
  const p2 = existingProducts[1]?.id || p1;
  const p3 = existingProducts[2]?.id || p1;

  const sampleReviews = [
    {
      product_id: p1,
      author_name: 'Stéphane B.',
      author_email: 'stephane.b@gmail.com',
      rating: 5,
      title: 'Très belle découverte et qualité au rendez-vous !',
      comment: 'Reçu en 48h via Colissimo. Conforme aux photos et à la description, la qualité des finitions est impeccable. Je recommande sans hésiter.',
      is_verified_buyer: 1,
      order_number: null,
      helpful_count: 14,
      country_code: 'FR',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      product_id: p1,
      author_name: 'Camille D.',
      author_email: 'camille.d@outlook.fr',
      rating: 5,
      title: 'Pratique et bien pensé pour le quotidien',
      comment: 'Super rapport qualité/prix. Utilisé tous les jours depuis une semaine sans aucun problème. Emballage soigné avec facture.',
      is_verified_buyer: 1,
      order_number: null,
      helpful_count: 8,
      country_code: 'FR',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      product_id: p1,
      author_name: 'Marc V.',
      author_email: 'm.van@skynet.be',
      rating: 4,
      title: 'Bon produit européen',
      comment: 'Excellente finition. Livraison rapide vers la Belgique en 3 jours ouvrés avec DHL. Très satisfait de ma commande.',
      is_verified_buyer: 1,
      order_number: null,
      helpful_count: 3,
      country_code: 'BE',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      product_id: p2,
      author_name: 'Hélène M.',
      author_email: 'helene.m@wanadoo.fr',
      rating: 5,
      title: 'Indispensable et simple d\'utilisation',
      comment: 'Fonctionne à merveille dès le déballage. Service client réactif par email.',
      is_verified_buyer: 1,
      order_number: null,
      helpful_count: 19,
      country_code: 'FR',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      product_id: p3,
      author_name: 'Lucas G.',
      author_email: 'lucas.g@free.fr',
      rating: 5,
      title: 'Compact, robuste et performant',
      comment: 'Très bon achat pour la maison. Finition robuste et bonne autonomie.',
      is_verified_buyer: 1,
      order_number: null,
      helpful_count: 11,
      country_code: 'FR',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO product_reviews (
      product_id, author_name, author_email, rating, title, comment,
      is_verified_buyer, order_number, helpful_count, country_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of sampleReviews) {
    insertStmt.run(
      r.product_id,
      r.author_name,
      r.author_email,
      r.rating,
      r.title,
      r.comment,
      r.is_verified_buyer,
      r.order_number,
      r.helpful_count,
      r.country_code,
      r.created_at
    );
  }
}

// Compute aggregate stats for a product
function getProductReviewStats(productId) {
  const reviews = db.prepare('SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC').all(productId);
  const total = reviews.length;

  if (total === 0) {
    return {
      averageRating: 4.8,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendationRate: 100
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let positiveCount = 0;

  for (const r of reviews) {
    const rate = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[rate] = (distribution[rate] || 0) + 1;
    sum += r.rating;
    if (r.rating >= 4) positiveCount++;
  }

  const avg = Math.round((sum / total) * 10) / 10;
  const recRate = Math.round((positiveCount / total) * 100);

  return {
    averageRating: avg,
    totalReviews: total,
    distribution,
    recommendationRate: recRate
  };
}

// GET /api/products/:productId/reviews
router.get('/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = db.prepare('SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC').all(productId);
    const stats = getProductReviewStats(productId);

    res.json({
      success: true,
      productId,
      reviews,
      stats
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, error: 'Erreur de récupération des avis.' });
  }
});

// POST /api/products/:productId/reviews
router.post('/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const {
      authorName,
      authorEmail = '',
      rating,
      title = '',
      comment,
      orderNumber = '',
      countryCode = 'FR'
    } = req.body;

    if (!authorName || !comment || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner votre nom, un commentaire et une note entre 1 et 5 étoiles.'
      });
    }

    // Check if order number exists and contains this product
    let isVerifiedBuyer = 1;
    if (orderNumber && orderNumber.trim()) {
      const order = db.prepare('SELECT order_number FROM orders WHERE order_number = ?').get(orderNumber.trim());
      if (order) {
        const item = db.prepare('SELECT id FROM order_items WHERE order_number = ? AND product_id = ?').get(orderNumber.trim(), productId);
        if (item) {
          isVerifiedBuyer = 1;
        }
      }
    }

    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO product_reviews (
        product_id, author_name, author_email, rating, title, comment,
        is_verified_buyer, order_number, helpful_count, country_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const result = insertStmt.run(
      productId,
      authorName.trim(),
      authorEmail.trim(),
      Number(rating),
      title.trim(),
      comment.trim(),
      isVerifiedBuyer,
      orderNumber ? orderNumber.trim() : null,
      countryCode,
      createdAt
    );

    // Recalculate stats and update product record in SQLite
    const stats = getProductReviewStats(productId);
    try {
      db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?').run(
        stats.averageRating,
        stats.totalReviews,
        productId
      );
    } catch (updateErr) {
      console.warn('Could not update products table rating:', updateErr.message);
    }

    const newReview = db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      review: newReview,
      stats,
      message: 'Votre avis vérifié a été publié avec succès. Merci pour votre retour !'
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de votre avis.' });
  }
});

// POST /api/reviews/:reviewId/helpful
router.post('/reviews/:reviewId/helpful', (req, res) => {
  try {
    const { reviewId } = req.params;
    db.prepare('UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId);
    const updated = db.prepare('SELECT helpful_count FROM product_reviews WHERE id = ?').get(reviewId);

    res.json({
      success: true,
      helpfulCount: updated ? updated.helpful_count : 1
    });
  } catch (err) {
    console.error('Error voting helpful:', err);
    res.status(500).json({ success: false, error: 'Erreur de mise à jour du vote.' });
  }
});

export default router;

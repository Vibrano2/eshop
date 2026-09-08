import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Helper to format product row
function formatProduct(row) {
  let details = {};
  try {
    details = JSON.parse(row.details_json || '{}');
  } catch {}

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    image: row.image,
    imageDisplayMode: row.image_display_mode,
    isBestSeller: Boolean(row.is_best_seller),
    isNew: Boolean(row.is_new),
    shortDescription: row.short_description,
    ...details
  };
}

// GET /api/products
router.get('/', (req, res) => {
  try {
    const {
      category,
      subcategory,
      q,
      minPrice,
      maxPrice,
      sort = 'popular',
      limit = 120,
      page = 1
    } = req.query;

    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (subcategory) {
      conditions.push('subcategory = ?');
      params.push(subcategory);
    }

    if (minPrice) {
      conditions.push('price >= ?');
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      conditions.push('price <= ?');
      params.push(Number(maxPrice));
    }

    if (q && q.trim()) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(subcategory) LIKE ? OR LOWER(short_description) LIKE ?)');
      const term = `%${q.toLowerCase().trim()}%`;
      params.push(term, term, term, term);
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY is_best_seller DESC, rating DESC';
    if (sort === 'price-asc') orderBy = 'ORDER BY price ASC';
    if (sort === 'price-desc') orderBy = 'ORDER BY price DESC';
    if (sort === 'rating') orderBy = 'ORDER BY rating DESC';
    if (sort === 'new') orderBy = 'ORDER BY is_new DESC, rowid DESC';

    const countStmt = db.prepare(`SELECT count(*) as total FROM products ${whereClause}`);
    const total = countStmt.get(...params).total;

    const parsedLimit = Math.min(200, Math.max(1, Number(limit) || 50));
    const parsedPage = Math.max(1, Number(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const listQuery = `SELECT * FROM products ${whereClause} ${orderBy} LIMIT ? OFFSET ?`;
    const rows = db.prepare(listQuery).all(...params, parsedLimit, offset);

    res.json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      products: rows.map(formatProduct)
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = formatProduct(row);

    // Fetch related products in the same category
    const relatedRows = db.prepare('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4').all(row.category, id);
    product.relatedProducts = relatedRows.map(formatProduct);

    res.json({ success: true, product });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve product' });
  }
});

export default router;

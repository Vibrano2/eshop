import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// POST /api/promo/validate
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        valid: false,
        discountAmount: 0,
        isFreeShipping: false,
        message: 'Veuillez saisir un code promo.'
      });
    }

    const normalized = code.trim().toUpperCase();

    // Check database promo codes
    let match = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(normalized);

    // Dynamic referral code support (e.g. ESHOP-EU4821)
    if (!match && normalized.startsWith('ESHOP-')) {
      match = {
        code: normalized,
        fixed_discount: 10.0,
        min_amount: 40.0,
        is_free_shipping: 0,
        description: 'Code parrainage ami : 10 € de réduction immédiate'
      };
    }

    if (!match) {
      return res.json({
        valid: false,
        discountAmount: 0,
        isFreeShipping: false,
        code: normalized,
        message: 'Code non reconnu. Essayez BIENVENUE10 pour -10% immédiat !'
      });
    }

    if (match.min_amount && Number(subtotal) < match.min_amount) {
      const missing = (match.min_amount - Number(subtotal)).toFixed(2);
      return res.json({
        valid: false,
        discountAmount: 0,
        isFreeShipping: false,
        code: normalized,
        message: `Ce code est réservé aux paniers d'au moins ${match.min_amount} € (il vous manque ${missing} €).`
      });
    }

    let discountAmount = 0;
    if (match.discount_percent) {
      discountAmount = Math.round((Number(subtotal) * (match.discount_percent / 100)) * 100) / 100;
    } else if (match.fixed_discount) {
      discountAmount = Math.min(Number(subtotal), match.fixed_discount);
    }

    res.json({
      valid: true,
      discountAmount,
      isFreeShipping: Boolean(match.is_free_shipping),
      code: normalized,
      description: match.description,
      message: `Code ${normalized} appliqué avec succès !`
    });
  } catch (err) {
    console.error('Error validating promo code:', err);
    res.status(500).json({ valid: false, error: 'Erreur lors de la validation du code promo.' });
  }
});

export default router;

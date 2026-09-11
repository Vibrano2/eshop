/**
 * Centralized promotional codes configuration and validation rules
 */
export const PROMO_CODES = [
  {
    code: 'BIENVENUE10',
    discountPercent: 10,
    minAmount: 0,
    description: '-10% sur tout le panier dès le 1er achat',
    badge: '-10%'
  },
  {
    code: 'PROMO15',
    discountPercent: 15,
    minAmount: 30,
    description: '-15% dès 30 € d\'achats',
    badge: '-15%'
  },
  {
    code: 'VIP20',
    discountPercent: 20,
    minAmount: 50,
    description: '-20% dès 50 € d\'achats',
    badge: '-20%'
  },
  {
    code: 'LIVRAISON',
    freeShipping: true,
    minAmount: 0,
    description: 'Livraison standard UE offerte',
    badge: 'Livraison Offerte'
  },
  // Cart Abandonment & Recovery Codes
  {
    code: 'REVIENS10',
    discountPercent: 10,
    minAmount: 0,
    description: 'Offre exclusive rétention : -10% immédiats sur votre panier',
    badge: '-10%'
  },
  // Loyalty & Referral Program Codes
  {
    code: 'FIDELITE5',
    fixedDiscount: 5.0,
    minAmount: 25,
    description: 'Bon fidélité de -5 € débloqué',
    badge: '-5 €'
  },
  {
    code: 'FIDELITE10',
    fixedDiscount: 10.0,
    minAmount: 40,
    description: 'Bon fidélité de -10 € débloqué',
    badge: '-10 €'
  },
  {
    code: 'FIDELITE20',
    fixedDiscount: 20.0,
    minAmount: 60,
    description: 'Bon fidélité VIP de -20 € débloqué',
    badge: '-20 €'
  },
  {
    code: 'PARRAIN10',
    fixedDiscount: 10.0,
    minAmount: 40,
    description: 'Offre parrainage : -10 € offerts',
    badge: '-10 €'
  }
];

/**
 * Validates a promo code string against cart subtotal
 * @param {string} codeRaw
 * @param {number} subtotal
 * @returns {{ valid: boolean, discountAmount: number, isFreeShipping: boolean, code: string, message: string }}
 */
export function validatePromoCode(codeRaw, subtotal) {
  if (!codeRaw || !codeRaw.trim()) {
    return { valid: false, discountAmount: 0, isFreeShipping: false, code: '', message: 'Veuillez saisir un code promo.' };
  }

  const normalized = codeRaw.trim().toUpperCase();
  let match = PROMO_CODES.find((p) => p.code === normalized);

  // Dynamic referral code support (e.g. ESHOP-EU4821)
  if (!match && normalized.startsWith('ESHOP-')) {
    match = {
      code: normalized,
      fixedDiscount: 10.0,
      minAmount: 40,
      description: 'Code de parrainage ami : -10 € de réduction immédiate',
      badge: '-10 €'
    };
  }

  if (!match) {
    return {
      valid: false,
      discountAmount: 0,
      isFreeShipping: false,
      code: normalized,
      message: 'Code non reconnu. Essayez BIENVENUE10 pour -10% immédiat !'
    };
  }

  if (match.minAmount && subtotal < match.minAmount) {
    const missing = (match.minAmount - subtotal).toFixed(2);
    return {
      valid: false,
      discountAmount: 0,
      isFreeShipping: false,
      code: normalized,
      message: `Ce code est réservé aux paniers d'au moins ${match.minAmount} € (il vous manque ${missing} €).`
    };
  }

  let discountAmount = 0;
  if (match.discountPercent) {
    discountAmount = Math.round((subtotal * (match.discountPercent / 100)) * 100) / 100;
  } else if (match.fixedDiscount) {
    discountAmount = Math.min(subtotal, match.fixedDiscount);
  }

  return {
    valid: true,
    discountAmount,
    isFreeShipping: !!match.freeShipping,
    code: normalized,
    description: match.description,
    message: `Code ${normalized} appliqué avec succès !`
  };
}

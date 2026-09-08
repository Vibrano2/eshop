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
  const match = PROMO_CODES.find((p) => p.code === normalized);

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

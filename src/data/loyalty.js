// Loyalty & Referral Program Data & Utilities

export const LOYALTY_REWARDS = [
  {
    id: 'reward-5',
    pointsRequired: 100,
    discountAmount: 5.0,
    code: 'FIDELITE5',
    minSubtotal: 25.0,
    title: {
      fr: 'Bon d’achat de 5 €',
      en: '€5 Discount Voucher',
      de: '5 € Rabattgutschein'
    },
    description: {
      fr: 'Valable dès 25 € d’achat sur toute la boutique.',
      en: 'Valid on orders over €25 across the entire store.',
      de: 'Gültig ab 25 € Einkaufswert auf das gesamte Sortiment.'
    }
  },
  {
    id: 'reward-10',
    pointsRequired: 200,
    discountAmount: 10.0,
    code: 'FIDELITE10',
    minSubtotal: 40.0,
    title: {
      fr: 'Bon d’achat de 10 €',
      en: '€10 Discount Voucher',
      de: '10 € Rabattgutschein'
    },
    description: {
      fr: 'Valable dès 40 € d’achat sur toute la boutique.',
      en: 'Valid on orders over €40 across the entire store.',
      de: 'Gültig ab 40 € Einkaufswert auf das gesamte Sortiment.'
    }
  },
  {
    id: 'reward-20',
    pointsRequired: 350,
    discountAmount: 20.0,
    code: 'FIDELITE20',
    minSubtotal: 60.0,
    title: {
      fr: 'Bon d’achat VIP de 20 €',
      en: '€20 VIP Discount Voucher',
      de: '20 € VIP-Rabattgutschein'
    },
    description: {
      fr: 'Valable dès 60 € d’achat sur toute la boutique.',
      en: 'Valid on orders over €60 across the entire store.',
      de: 'Gültig ab 60 € Einkaufswert auf das gesamte Sortiment.'
    }
  }
];

export const INITIAL_LOYALTY_STATE = {
  points: 50, // Welcome gift points
  referralCode: 'ESHOP-EU' + Math.floor(1000 + Math.random() * 9000),
  referralsCount: 0,
  claimedCoupons: [],
  history: [
    {
      id: 'h-welcome',
      date: new Date().toLocaleDateString('fr-FR'),
      label: 'Cadeau de bienvenue',
      points: 50,
      type: 'credit'
    }
  ]
};

export function calculatePointsForAmount(amount) {
  if (!amount || amount <= 0) return 0;
  // 1 point per whole euro spent
  return Math.floor(amount);
}

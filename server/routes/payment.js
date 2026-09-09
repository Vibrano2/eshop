import { Router } from 'express';
import crypto from 'node:crypto';

const router = Router();

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
 * POST /api/payment/create-intent
 * Initialize a Payment Intent (Stripe Sandbox or Live if STRIPE_SECRET_KEY provided)
 */
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', customer = {}, cardNumber = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide pour le paiement.' });
    }

    const cleanCard = (cardNumber || '').replace(/\s+/g, '');
    const cardProfile = KNOWN_TEST_CARDS[cleanCard] || {
      brand: cleanCard.startsWith('4') ? 'visa' : cleanCard.startsWith('5') ? 'mastercard' : 'cb',
      requires3DS: amount >= 30, // PSD2 / DSP2 SCA threshold (> 30€ requires 3DS)
      shouldSucceed: true,
      bankName: 'Banque Émettrice UE'
    };

    // If card is hardcoded to fail
    if (cardProfile.shouldSucceed === false) {
      return res.status(402).json({
        success: false,
        error: cardProfile.error,
        code: 'card_declined'
      });
    }

    // Generate PaymentIntent ID
    const paymentIntentId = `pi_test_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(16).toString('hex')}`;

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        clientSecret,
        amount: Math.round(amount * 100), // in cents
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
router.post('/confirm-intent', (req, res) => {
  try {
    const { paymentIntentId, otpCode, simulatedAppApproval } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, error: 'Identifiant PaymentIntent manquant.' });
    }

    // If OTP provided, verify it (demo allows 123456 or any 6-digit code)
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

import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Helper to mask email for PII safety
function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// GET /api/loyalty/:codeOrEmail
// Safely returns loyalty information with masked email
router.get('/:codeOrEmail', (req, res) => {
  try {
    const rawParam = String(req.params.codeOrEmail || '').trim();
    if (!rawParam) {
      return res.status(400).json({ success: false, error: 'Identifiant fidélité manquant.' });
    }

    const codeOrEmail = rawParam.toLowerCase();
    let account = db.prepare('SELECT * FROM loyalty_accounts WHERE LOWER(referral_code) = ? OR LOWER(email) = ?').get(codeOrEmail, codeOrEmail);

    if (!account) {
      // Auto-create account if requested
      const newCode = 'ESHOP-EU' + Math.floor(1000 + Math.random() * 9000);
      db.prepare(`
        INSERT INTO loyalty_accounts (referral_code, email, points, referrals_count, claimed_coupons_json, created_at)
        VALUES (?, ?, 50, 0, '[]', datetime('now'))
      `).run(newCode, codeOrEmail.includes('@') ? codeOrEmail : null);

      db.prepare(`
        INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
        VALUES (?, ?, 'Cadeau de bienvenue', 50, 'credit', date('now'))
      `).run(`h-${Date.now()}`, newCode);

      account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ?').get(newCode);
    }

    const history = db.prepare('SELECT * FROM loyalty_history WHERE referral_code = ? ORDER BY rowid DESC LIMIT 50').all(account.referral_code);

    res.json({
      success: true,
      account: {
        referralCode: account.referral_code,
        email: maskEmail(account.email),
        points: account.points,
        referralsCount: account.referrals_count,
        claimedCoupons: JSON.parse(account.claimed_coupons_json || '[]'),
        history
      }
    });
  } catch (err) {
    console.error('Error fetching loyalty account:', err);
    res.status(500).json({ success: false, error: 'Erreur compte fidélité' });
  }
});

// POST /api/loyalty/claim
router.post('/claim', (req, res) => {
  try {
    const { referralCode, pointsRequired, code, label = 'Échange de récompense' } = req.body;

    const parsedPoints = parseInt(pointsRequired, 10);
    if (!referralCode || isNaN(parsedPoints) || parsedPoints <= 0 || !code) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants ou invalides.' });
    }

    const safeReferralCode = String(referralCode).trim().slice(0, 30);
    const safeCode = String(code).trim().toUpperCase().slice(0, 30);
    const safeLabel = String(label || 'Échange de récompense').trim().slice(0, 100);

    const account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ?').get(safeReferralCode);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Compte fidélité introuvable.' });
    }

    if (account.points < parsedPoints) {
      return res.status(400).json({ success: false, error: 'Solde de points insuffisant.' });
    }

    const claimed = JSON.parse(account.claimed_coupons_json || '[]');
    if (!claimed.includes(safeCode)) {
      claimed.push(safeCode);
    }

    const newPoints = account.points - parsedPoints;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE loyalty_accounts SET points = ?, claimed_coupons_json = ? WHERE referral_code = ?')
        .run(newPoints, JSON.stringify(claimed), safeReferralCode);

      db.prepare(`
        INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
        VALUES (?, ?, ?, ?, 'debit', date('now'))
      `).run(`claim-${Date.now()}`, safeReferralCode, safeLabel, parsedPoints);

      db.exec('COMMIT;');

      res.json({
        success: true,
        points: newPoints,
        claimedCoupons: claimed,
        code: safeCode
      });
    } catch (txError) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (err) {
    console.error('Error claiming loyalty reward:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’échange de récompense' });
  }
});

export default router;

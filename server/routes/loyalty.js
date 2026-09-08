import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/loyalty/:codeOrEmail
router.get('/:codeOrEmail', (req, res) => {
  try {
    const { codeOrEmail } = req.params;
    let account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ? OR email = ?').get(codeOrEmail, codeOrEmail);

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

    const history = db.prepare('SELECT * FROM loyalty_history WHERE referral_code = ? ORDER BY rowid DESC').all(account.referral_code);

    res.json({
      success: true,
      account: {
        referralCode: account.referral_code,
        email: account.email,
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

    if (!referralCode || !pointsRequired || !code) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
    }

    const account = db.prepare('SELECT * FROM loyalty_accounts WHERE referral_code = ?').get(referralCode);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Compte fidélité introuvable.' });
    }

    if (account.points < pointsRequired) {
      return res.status(400).json({ success: false, error: 'Solde de points insuffisant.' });
    }

    const claimed = JSON.parse(account.claimed_coupons_json || '[]');
    if (!claimed.includes(code)) {
      claimed.push(code);
    }

    const newPoints = account.points - pointsRequired;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE loyalty_accounts SET points = ?, claimed_coupons_json = ? WHERE referral_code = ?')
        .run(newPoints, JSON.stringify(claimed), referralCode);

      db.prepare(`
        INSERT INTO loyalty_history (id, referral_code, label, points, type, date)
        VALUES (?, ?, ?, ?, 'debit', date('now'))
      `).run(`claim-${Date.now()}`, referralCode, label, pointsRequired);

      db.exec('COMMIT;');

      res.json({
        success: true,
        points: newPoints,
        claimedCoupons: claimed,
        code
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

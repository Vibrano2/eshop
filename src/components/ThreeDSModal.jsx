import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Building2,
  Clock
} from 'lucide-react';

const EU_BANKS = [
  { id: 'bnp', name: 'BNP Paribas', color: '#00965e', tag: 'Verified by Visa' },
  { id: 'ca', name: 'Crédit Agricole', color: '#008375', tag: 'Mastercard ID Check' },
  { id: 'sg', name: 'Société Générale', color: '#e2001a', tag: 'SecurPass' },
  { id: 'revolut', name: 'Revolut Bank', color: '#0075eb', tag: 'In-App Approval' },
  { id: 'n26', name: 'N26 Bank', color: '#36a18b', tag: '3D Secure v2' }
];

export default function ThreeDSModal({
  isOpen,
  onClose,
  onSuccess,
  totalAmount = 0,
  cardLast4 = '4242',
  cardBrand = 'visa',
  defaultBank = 'bnp'
}) {
  const [selectedBank, setSelectedBank] = useState(
    EU_BANKS.find((b) => b.id === defaultBank) || EU_BANKS[0]
  );
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' or 'app'
  const [otpCode, setOtpCode] = useState('123456');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [appSecondsLeft, setAppSecondsLeft] = useState(120);

  useEffect(() => {
    if (!isOpen) return;
    setOtpCode('123456');
    setErrorMsg('');
    setIsVerifying(false);
    setAppSecondsLeft(120);
  }, [isOpen]);

  // App countdown timer
  useEffect(() => {
    if (!isOpen || authMethod !== 'app') return;
    const interval = setInterval(() => {
      setAppSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, authMethod]);

  if (!isOpen) return null;

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpCode.length !== 6) {
      setErrorMsg('Veuillez saisir le code à 6 chiffres (Exemple : 123456).');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess({
        method: 'otp',
        bank: selectedBank.name,
        verifiedAt: new Date().toISOString()
      });
    }, 1000);
  };

  const handleAppApprove = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess({
        method: 'app_push',
        bank: selectedBank.name,
        verifiedAt: new Date().toISOString()
      });
    }, 1200);
  };

  return (
    <div className="threeds-modal-overlay" role="dialog" aria-modal="true">
      <div className="threeds-modal-container">
        {/* Header with Bank Badge & 3DS Logo */}
        <div className="threeds-header">
          <div className="threeds-bank-info">
            <div
              className="threeds-bank-logo"
              style={{ backgroundColor: selectedBank.color }}
            >
              <Building2 size={20} color="#ffffff" />
            </div>
            <div>
              <span className="threeds-bank-title">{selectedBank.name}</span>
              <span className="threeds-protocol-tag">
                <ShieldCheck size={12} /> {selectedBank.tag}
              </span>
            </div>
          </div>

          <button
            className="threeds-close-btn"
            onClick={onClose}
            aria-label="Annuler l'authentification"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Summary Box */}
        <div className="threeds-summary-box">
          <div className="summary-row">
            <span className="summary-label">Marchand :</span>
            <span className="summary-value font-bold">ESHOP-STORE.EU</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Montant à régler :</span>
            <span className="summary-value font-bold text-highlight">
              {Number(totalAmount).toFixed(2)} €
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Carte bancaire :</span>
            <span className="summary-value font-mono">
              •••• •••• •••• {cardLast4}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Date :</span>
            <span className="summary-value">
              {new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Auth Method Tabs */}
        <div className="threeds-method-tabs">
          <button
            type="button"
            className={`method-tab ${authMethod === 'otp' ? 'active' : ''}`}
            onClick={() => setAuthMethod('otp')}
          >
            <MessageSquare size={16} />
            <span>Code SMS / OTP</span>
          </button>
          <button
            type="button"
            className={`method-tab ${authMethod === 'app' ? 'active' : ''}`}
            onClick={() => setAuthMethod('app')}
          >
            <Smartphone size={16} />
            <span>App Mobile (Pass Sécurité)</span>
          </button>
        </div>

        {/* Method 1: SMS OTP */}
        {authMethod === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="threeds-body">
            <p className="threeds-instruction">
              Pour des raisons de sécurité (DSP2), veuillez saisir le code de validation reçu par SMS au <strong>+33 6 •• •• 78</strong>.
            </p>

            <div className="otp-sandbox-hint">
              <span className="hint-pill">SANDBOX STRIPE</span>
              <span>Code de démonstration pré-rempli : <strong>123456</strong></span>
            </div>

            {errorMsg && (
              <div className="threeds-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="otp-input-group">
              <label htmlFor="threeds-otp-input">Code de sécurité à 6 chiffres</label>
              <input
                id="threeds-otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="otp-field"
                autoFocus
              />
            </div>

            <div className="threeds-actions">
              <button
                type="submit"
                disabled={isVerifying}
                className="threeds-btn-submit"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Confirmer et régler {Number(totalAmount).toFixed(2)} €</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="threeds-btn-cancel"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Method 2: Mobile App Push */}
        {authMethod === 'app' && (
          <div className="threeds-body">
            <div className="app-push-card">
              <div className="app-push-icon-pulse">
                <Smartphone size={32} color={selectedBank.color} />
              </div>
              <h4>Vérifiez votre application {selectedBank.name}</h4>
              <p>
                Une demande d'autorisation de <strong>{Number(totalAmount).toFixed(2)} €</strong> pour <strong>ESHOP-STORE.EU</strong> vous attend sur votre smartphone.
              </p>
              <div className="app-timer">
                <Clock size={14} />
                <span>Temps restant : {Math.floor(appSecondsLeft / 60)}:{(appSecondsLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="threeds-actions">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleAppApprove}
                className="threeds-btn-submit"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Validation bancaire...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Simuler l'approbation sur mon smartphone</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="threeds-btn-cancel"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Footer legal notices */}
        <div className="threeds-footer">
          <div className="threeds-badges">
            <span className="threeds-badge-pill">3D SECURE v2</span>
            <span className="threeds-badge-pill">CONFORME DSP2</span>
            <span className="threeds-badge-pill">CHIFFREMENT 256 BITS</span>
          </div>
          <p className="threeds-legal">
            Authentification forte du client conformément à la directive européenne sur les services de paiement (DSP2).
          </p>
        </div>
      </div>
    </div>
  );
}

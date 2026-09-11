import React, { useState, useEffect } from 'react';
import {
  X,
  Timer,
  Tag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Percent,
  Check
} from 'lucide-react';

const INITIAL_SECONDS = 15 * 60; // 15 minutes countdown

export default function AbandonedCartModal({
  isOpen,
  onClose,
  items = [],
  subtotal = 0,
  onApplyDiscountAndCheckout,
  onApplyDiscountAndStay
}) {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [copied, setCopied] = useState(false);

  // Live countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || items.length === 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = (secondsLeft / INITIAL_SECONDS) * 100;

  const discountAmount = subtotal * 0.10;
  const discountedTotal = Math.max(0, subtotal - discountAmount);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('REVIENS10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="abandoned-cart-overlay animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandoned-cart-title"
    >
      <div
        className="abandoned-cart-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent Top Progress Bar */}
        <div className="countdown-progress-bar-wrap">
          <div
            className="countdown-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="abandoned-cart-close-btn"
          onClick={onClose}
          aria-label="Fermer l'offre"
        >
          <X size={20} />
        </button>

        <div className="abandoned-cart-content">
          {/* Header Badge & Title */}
          <div className="abandoned-header-center">
            <div className="abandoned-gift-pill">
              <Sparkles size={16} />
              <span>Cadeau Exclusif de Bienvenue</span>
            </div>

            <h2 id="abandoned-cart-title" className="abandoned-cart-heading">
              Attendez ! Ne repartez pas sans vos articles 🎁
            </h2>

            <p className="abandoned-cart-sub">
              Vos articles sont réservés dans votre panier. Profitez exceptionnellement de{' '}
              <strong>-10% supplémentaires immédiats</strong> pour finaliser votre commande.
            </p>
          </div>

          {/* Live Countdown Card */}
          <div className="abandoned-countdown-box">
            <div className="countdown-clock-row">
              <Timer size={18} className="countdown-pulse-icon" />
              <span className="countdown-text">Offre valable pendant encore :</span>
              <span className="countdown-timer-digits">{formattedTime}</span>
            </div>
          </div>

          {/* Coupon Display Card */}
          <div className="abandoned-coupon-banner">
            <div className="coupon-code-wrap">
              <Tag size={16} className="coupon-tag-icon" />
              <span className="coupon-code-value">REVIENS10</span>
              <button
                type="button"
                className="coupon-copy-btn"
                onClick={handleCopyCode}
                title="Copier le code promo"
              >
                {copied ? <Check size={14} color="#10b981" /> : 'Copier'}
              </button>
            </div>
            <span className="coupon-benefit-text">
              -10% de remise immédiate sur votre panier
            </span>
          </div>

          {/* Cart Preview & Calculation */}
          <div className="abandoned-cart-preview-box">
            <div className="preview-items-row">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="preview-item-thumb-box" title={item.name}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="preview-item-img"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                    }}
                  />
                  {item.quantity > 1 && (
                    <span className="preview-qty-badge">x{item.quantity}</span>
                  )}
                </div>
              ))}
              {items.length > 3 && (
                <div className="preview-more-badge">
                  +{items.length - 3}
                </div>
              )}
            </div>

            <div className="preview-pricing-col">
              <div className="pricing-line">
                <span className="pricing-label">Sous-total initial :</span>
                <span className="pricing-val old-price">{subtotal.toFixed(2)} €</span>
              </div>
              <div className="pricing-line discount-line">
                <span className="pricing-label">Réduction immédiate (-10%) :</span>
                <span className="pricing-val discount-val">-{discountAmount.toFixed(2)} €</span>
              </div>
              <div className="pricing-line total-line">
                <span className="pricing-label">Nouveau total :</span>
                <span className="pricing-val new-total">{discountedTotal.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="abandoned-actions-stack">
            <button
              type="button"
              className="btn btn-primary abandoned-primary-btn"
              onClick={() => onApplyDiscountAndCheckout('REVIENS10')}
            >
              <Percent size={18} />
              <span>Valider mes -10% et commander ({discountedTotal.toFixed(2)} €)</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="abandoned-secondary-btn"
              onClick={() => onApplyDiscountAndStay('REVIENS10')}
            >
              <span>Appliquer les -10% et continuer mes achats</span>
            </button>

            <button
              type="button"
              className="abandoned-refuse-btn"
              onClick={onClose}
            >
              Non merci, je préfère payer le prix fort
            </button>
          </div>

          {/* Reassurance Pillars Footer */}
          <div className="abandoned-reassurance-row">
            <div className="reassurance-mini-pill">
              <Truck size={14} color="#059669" />
              <span>Expédition 2-4j UE</span>
            </div>
            <div className="reassurance-mini-pill">
              <ShieldCheck size={14} color="#059669" />
              <span>Paiement 3D-Secure</span>
            </div>
            <div className="reassurance-mini-pill">
              <RotateCcw size={14} color="#059669" />
              <span>30j satisfait ou remboursé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

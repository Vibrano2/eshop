import React, { useState } from 'react';
import {
  X,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  ShoppingBag,
  Sparkles,
  Truck,
  Check,
  Gift
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { PROMO_CODES } from '../data/promoCodes';

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQty,
  onRemoveItem,
  onAddToCart,
  discountCode,
  discountAmount = 0,
  isPromoFreeShipping = false,
  promoMessage = '',
  onApplyPromo,
  onRemovePromo,
  onProceedToCheckout,
  onOpenLoyalty,
  onOpenShop,
  lang = 'fr'
}) {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [localPromoError, setLocalPromoError] = useState('');
  const [localPromoSuccess, setLocalPromoSuccess] = useState('');

  // Cart math
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 40.0;
  const progressPercent = Math.min(100, Math.max(0, (subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isFreeDelivery = subtotal >= FREE_SHIPPING_THRESHOLD || isPromoFreeShipping;
  const shippingFee = isFreeDelivery || subtotal === 0 ? 0.0 : 3.90;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Dynamic cross-sell bundle & impulse upsell candidate
  const upsellProduct = React.useMemo(() => {
    // 1. Prioritize complementary bundle items for products currently in the cart
    for (const item of items) {
      if (item.bundleWith && !items.some((i) => i.id === item.bundleWith)) {
        const found = PRODUCTS.find((p) => p.id === item.bundleWith);
        if (found) return found;
      }
    }
    // 2. Fallbacks near the remaining shipping threshold or high-converting small items
    const fallbackIds = [
      'porte-cartes-aluminium-anti-rfid',
      'mini-poubelle-voiture-etanche',
      'bandeau-spa-velours',
      'etiquettes-bagages-cuir-lot2',
      'chiffons-microfibres-auto-lot3'
    ];
    for (const fid of fallbackIds) {
      if (!items.some((i) => i.id === fid)) {
        const found = PRODUCTS.find((p) => p.id === fid);
        if (found) return found;
      }
    }
    return PRODUCTS[0] || null;
  }, [items]);

  const isUpsellInCart = items.some((i) => i.id === upsellProduct?.id);

  const handleApplyPromoSubmit = (e) => {
    e?.preventDefault();
    setLocalPromoError('');
    setLocalPromoSuccess('');

    if (!promoInput.trim()) {
      setLocalPromoError('Veuillez saisir un code promo.');
      return;
    }

    if (onApplyPromo) {
      const res = onApplyPromo(promoInput.trim());
      if (res.valid) {
        setLocalPromoSuccess(res.message);
        setPromoInput('');
      } else {
        setLocalPromoError(res.message);
      }
    }
  };

  const handleQuickApplyPromo = (code) => {
    setLocalPromoError('');
    setLocalPromoSuccess('');
    setPromoInput(code);
    if (onApplyPromo) {
      const res = onApplyPromo(code);
      if (res.valid) {
        setLocalPromoSuccess(res.message);
        setPromoInput('');
      } else {
        setLocalPromoError(res.message);
      }
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <ShoppingBag size={20} color="#1e3a8a" />
            <span>Votre Panier ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer le panier">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Interactive Free Shipping Tier Tracker */}
          {items.length > 0 && (
            <div className={`shipping-progress-box ${isFreeDelivery ? 'tier-unlocked' : ''}`}>
              <div className="shipping-progress-text">
                {isFreeDelivery ? (
                  <span className="shipping-unlocked-banner">
                    <Sparkles size={16} color="#059669" />
                    <strong>Livraison UE offerte !</strong> Vous économisez 3,90 €
                  </span>
                ) : (
                  <span>
                    Plus que <strong>{remainingForFree.toFixed(2)} €</strong> pour la livraison offerte
                  </span>
                )}
                <span className="progress-percent-badge">{Math.round(progressPercent)}%</span>
              </div>

              <div className="progress-bar-bg">
                <div
                  className={`progress-bar-fill ${isFreeDelivery ? 'progress-fill-success' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Milestone Markers */}
              <div className="shipping-milestones">
                <span className="milestone-label">0 €</span>
                <span className={`milestone-label ${subtotal >= 20 ? 'passed' : ''}`}>20 €</span>
                <span className={`milestone-label ${isFreeDelivery ? 'passed' : ''}`}>
                  <Truck size={12} style={{ display: 'inline', marginRight: 2 }} /> 40 € (Offert)
                </span>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <div className="empty-cart-circle">
                <ShoppingBag size={42} color="#94a3b8" />
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                {lang === 'en' ? 'Your cart is empty' : 'Votre panier est vide'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '280px', margin: '0 auto 1.5rem' }}>
                {lang === 'en'
                  ? `Discover our ${PRODUCTS.length} carefully selected items shipped within 24h.`
                  : `Découvrez nos ${PRODUCTS.length} articles rigoureusement sélectionnés expédiés sous 24h.`}
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  if (typeof onOpenShop === 'function') {
                    onOpenShop('all');
                  }
                }}
              >
                {lang === 'en' ? 'Explore catalog' : 'Découvrir le catalogue'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div key={item.key || item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.altText || item.name}
                    className="cart-item-img"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-title">{item.name}</div>
                    {(item.selectedSize || item.selectedColor) && (
                      <div className="cart-item-variant">
                        {item.selectedSize && <span>Taille : <strong>{item.selectedSize}</strong></span>}
                        {item.selectedSize && item.selectedColor && <span> • </span>}
                        {item.selectedColor && <span>Couleur : <strong>{item.selectedColor}</strong></span>}
                      </div>
                    )}
                    <div className="cart-item-price">
                      {(item.price * item.quantity).toFixed(2)} €
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQty(item.key || item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuer la quantité"
                        >
                          -
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQty(item.key || item.id, item.quantity + 1)}
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => onRemoveItem(item.key || item.id)}
                        title="Supprimer l'article"
                        aria-label="Supprimer du panier"
                      >
                        <Trash2 size={14} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 1-Click Upsell Impulse Item with Free Shipping Catalyst */}
          {items.length > 0 && !isUpsellInCart && upsellProduct && (
            <div className="cart-upsell-card">
              <img
                src={upsellProduct.image}
                alt={upsellProduct.name}
                className="cart-upsell-img"
              />
              <div className="cart-upsell-info" style={{ flex: 1 }}>
                <div className="cart-upsell-header-badge">
                  {remainingForFree > 0 && remainingForFree <= 15 ? (
                    <span className="catalyst-badge">⚡ Complétez pour la livraison offerte</span>
                  ) : (
                    <h5>OFFRE SPÉCIALE PANIER</h5>
                  )}
                </div>
                <p>{upsellProduct.name}</p>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#c2410c' }}>
                  Seulement {upsellProduct.price.toFixed(2)} €
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAddToCart(upsellProduct, 1)}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', flexShrink: 0 }}
              >
                + Ajouter
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            {/* Promo Code System */}
            {discountCode ? (
              <div className="applied-promo-pill">
                <div className="applied-promo-info">
                  <Tag size={14} color="#059669" />
                  <span>
                    Code <strong>{discountCode}</strong> appliqué{' '}
                    {discountAmount > 0 && `(-${discountAmount.toFixed(2)} €)`}
                    {isPromoFreeShipping && '(Livraison offerte)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="remove-promo-btn"
                  onClick={onRemovePromo}
                  title="Retirer le code promo"
                >
                  <X size={14} />
                  <span>Retirer</span>
                </button>
              </div>
            ) : (
              <div className="promo-input-section">
                <form onSubmit={handleApplyPromoSubmit} className="cart-promo-form">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Code promo (ex: BIENVENUE10)"
                      className="cart-promo-input"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setLocalPromoError('');
                      }}
                    />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">
                    Appliquer
                  </button>
                </form>

                {/* Promo helper error/success messages */}
                {localPromoError && (
                  <div className="promo-message-error">
                    {localPromoError}
                  </div>
                )}
                {localPromoSuccess && (
                  <div className="promo-message-success">
                    {localPromoSuccess}
                  </div>
                )}

                {/* Quick Promo Suggestions Pills */}
                <div className="quick-promo-suggestions">
                  <span className="suggestions-label">Codes disponibles :</span>
                  <div className="suggestion-chips-row">
                    {PROMO_CODES.map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        className="quick-promo-chip"
                        onClick={() => handleQuickApplyPromo(p.code)}
                        title={p.description}
                      >
                        {p.code} <span className="chip-badge">{p.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="cart-summary-breakdown">
              <div className="cart-summary-row">
                <span>Sous-total articles</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>

              {discountAmount > 0 && (
                <div className="cart-summary-row promo-row">
                  <span>Remise ({discountCode})</span>
                  <span>-{discountAmount.toFixed(2)} €</span>
                </div>
              )}

              <div className="cart-summary-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={14} color="#64748b" />
                  <span>Livraison standard UE</span>
                </span>
                <span>
                  {isFreeDelivery ? (
                    <span className="free-shipping-tag">
                      <span className="old-shipping-price">3.90 €</span>
                      <strong>OFFERTE</strong>
                    </span>
                  ) : (
                    '3.90 €'
                  )}
                </span>
              </div>

              <div className="cart-summary-row total">
                <span>Total TTC</span>
                <span>{finalTotal.toFixed(2)} €</span>
              </div>
            </div>

            {/* Loyalty Points Preview */}
            <div
              className="cart-loyalty-earning-pill"
              onClick={onOpenLoyalty}
              style={{ cursor: onOpenLoyalty ? 'pointer' : 'default' }}
              title="Club Fidélité & Parrainage"
            >
              <Gift size={14} color="#ec4899" />
              <span>
                {lang === 'de'
                  ? `🎁 Bei dieser Bestellung sammeln Sie +${Math.floor(finalTotal)} Treuepunkte !`
                  : lang === 'en'
                  ? `🎁 This order earns you +${Math.floor(finalTotal)} loyalty points!`
                  : `🎁 Cette commande vous rapportera +${Math.floor(finalTotal)} points fidélité !`}
              </span>
            </div>

            {/* Checkout CTA */}
            <button
              className="btn btn-primary btn-block btn-lg checkout-cta-btn"
              onClick={onProceedToCheckout}
            >
              <ShieldCheck size={18} />
              <span>Commander en toute sécurité • {finalTotal.toFixed(2)} €</span>
              <ArrowRight size={16} />
            </button>

            <div className="cart-trust-microcopy">
              <span>🔒 Paiement SSL 256 bits</span>
              <span>•</span>
              <span>Expédié sous 24h UE</span>
              <span>•</span>
              <span>Garantie 2 ans</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

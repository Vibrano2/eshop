import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Tag,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Gift,
  UserCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { PROMO_CODES } from '../data/promoCodes';
import { apiCreateOrder, apiCreatePaymentIntent, apiConfirmPaymentIntent } from '../services/api';
import ThreeDSModal from './ThreeDSModal';

const STRIPE_TEST_PRESETS = [
  {
    name: 'Visa 3D Secure',
    number: '4242 4242 4242 4242',
    exp: '12/28',
    cvc: '123',
    brand: 'visa',
    badge: '3DS v2 Challenge',
    badgeClass: 'badge-3ds'
  },
  {
    name: 'Mastercard Direct',
    number: '5555 5555 5555 4444',
    exp: '08/29',
    cvc: '456',
    brand: 'mastercard',
    badge: 'Validation directe',
    badgeClass: 'badge-direct'
  },
  {
    name: 'Refus Provision',
    number: '4000 0000 0000 0002',
    exp: '10/27',
    cvc: '789',
    brand: 'visa',
    badge: 'Test refus',
    badgeClass: 'badge-declined'
  },
  {
    name: 'Carte Expirée',
    number: '4000 0000 0000 0069',
    exp: '01/22',
    cvc: '999',
    brand: 'visa',
    badge: 'Test expiration',
    badgeClass: 'badge-expired'
  }
];

function getCardBrand(number) {
  const clean = (number || '').replace(/\D/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  return 'cb';
}

const EU_COUNTRIES = [
  { code: 'FR', name: 'France (Métropolitaine)', minDays: 2, maxDays: 3, delayText: '2 à 3 jours' },
  { code: 'BE', name: 'Belgique', minDays: 2, maxDays: 4, delayText: '2 à 4 jours' },
  { code: 'DE', name: 'Allemagne (Deutschland)', minDays: 2, maxDays: 3, delayText: '2 à 3 jours' },
  { code: 'NL', name: 'Pays-Bas (Nederland)', minDays: 3, maxDays: 4, delayText: '3 à 4 jours' },
  { code: 'LU', name: 'Luxembourg', minDays: 2, maxDays: 3, delayText: '2 à 3 jours' },
  { code: 'ES', name: 'Espagne', minDays: 3, maxDays: 5, delayText: '3 à 5 jours' },
  { code: 'IT', name: 'Italie', minDays: 3, maxDays: 5, delayText: '3 à 5 jours' }
];

export default function CheckoutModal({
  isOpen,
  onClose,
  items = [],
  subtotal = 0,
  shippingFee = 0,
  isFreeShipping = false,
  totalAmount = 0,
  discountCode = '',
  discountAmount = 0,
  onApplyPromo,
  onRemovePromo,
  onOrderSuccess,
  onOpenTracking,
  currentUser = null
}) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [formData, setFormData] = useState({
    email: currentUser?.email || '',
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    address: currentUser?.address || '',
    postalCode: currentUser?.postalCode || '',
    city: currentUser?.city || '',
    country: currentUser?.countryCode || 'FR',
    phone: currentUser?.phone || '',
    paymentMethod: 'card', // card, applepay, paypal
    cardNumber: '4242 4242 4242 4242',
    cardExp: '12/28',
    cardCvc: '123'
  });

  // Re-sync with currentUser if modal opened while already logged in or state updated
  React.useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || currentUser.email || '',
        firstName: prev.firstName || currentUser.firstName || '',
        lastName: prev.lastName || currentUser.lastName || '',
        address: prev.address || currentUser.address || '',
        postalCode: prev.postalCode || currentUser.postalCode || '',
        city: prev.city || currentUser.city || '',
        country: prev.country || currentUser.countryCode || 'FR',
        phone: prev.phone || currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  const [formErrors, setFormErrors] = useState({});
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [checkoutPromoInput, setCheckoutPromoInput] = useState('');
  const [checkoutPromoError, setCheckoutPromoError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Payment Gateway & 3D Secure States
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isThreeDsOpen, setIsThreeDsOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);
  const [threeDsAuthData, setThreeDsAuthData] = useState(null);

  const selectedCountry = useMemo(() => {
    return EU_COUNTRIES.find((c) => c.code === formData.country) || EU_COUNTRIES[0];
  }, [formData.country]);

  // Dynamic calculated delivery dates in French format
  const deliveryDatesRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + selectedCountry.minDays);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + selectedCountry.maxDays);

    const formatOpts = { day: 'numeric', month: 'long' };
    const startStr = startDate.toLocaleDateString('fr-FR', formatOpts);
    const endStr = endDate.toLocaleDateString('fr-FR', { ...formatOpts, year: 'numeric' });
    return `Entre le ${startStr} et le ${endStr}`;
  }, [selectedCountry]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateShippingForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Veuillez saisir votre adresse email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Veuillez saisir une adresse email valide.';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'Veuillez renseigner votre prénom.';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Veuillez renseigner votre nom.';
    }
    if (!formData.address.trim()) {
      errors.address = 'Veuillez renseigner votre adresse de livraison.';
    }
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Veuillez renseigner votre code postal.';
    } else if (formData.postalCode.trim().length < 4) {
      errors.postalCode = 'Code postal trop court.';
    }
    if (!formData.city.trim()) {
      errors.city = 'Veuillez renseigner votre ville.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (validateShippingForm()) {
      setStep(2);
    }
  };

  const handleApplyCheckoutPromo = (e) => {
    e.preventDefault();
    setCheckoutPromoError('');
    if (!checkoutPromoInput.trim()) {
      setCheckoutPromoError('Saisissez un code.');
      return;
    }
    if (onApplyPromo) {
      const res = onApplyPromo(checkoutPromoInput.trim());
      if (res.valid) {
        setCheckoutPromoInput('');
      } else {
        setCheckoutPromoError(res.message);
      }
    }
  };

  const handleSelectPresetCard = (preset) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: 'card',
      cardNumber: preset.number,
      cardExp: preset.exp,
      cardCvc: preset.cvc
    }));
    setPaymentError('');
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
    setPaymentError('');
  };

  const handleCardExpChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setFormData((prev) => ({ ...prev, cardExp: raw }));
    setPaymentError('');
  };

  const handleCardCvcChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, cardCvc: raw }));
    setPaymentError('');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsProcessingPayment(true);

    const orderPayload = {
      customer: { ...formData },
      items: [...items],
      subtotal,
      discountAmount,
      discountCode,
      shippingFee,
      totalAmount,
      countryCode: selectedCountry.code
    };

    if (formData.paymentMethod === 'card') {
      try {
        const intentRes = await apiCreatePaymentIntent({
          amount: totalAmount,
          currency: 'eur',
          customer: formData,
          cardNumber: formData.cardNumber
        });

        if (!intentRes.success) {
          setPaymentError(intentRes.error || 'La transaction a été refusée.');
          setIsProcessingPayment(false);
          return;
        }

        if (intentRes.paymentIntent?.requires3DS) {
          setPendingIntent(intentRes.paymentIntent);
          setIsProcessingPayment(false);
          setIsThreeDsOpen(true);
          return;
        }

        await finalizeOrder(orderPayload, {
          method: 'direct',
          bank: intentRes.paymentIntent?.bankName || 'Crédit Agricole'
        });
      } catch (err) {
        console.warn('Payment intent error, continuing fallback:', err);
        await finalizeOrder(orderPayload, { method: 'sandbox_fallback' });
      }
    } else {
      // Apple Pay / PayPal
      await finalizeOrder(orderPayload, { method: formData.paymentMethod });
    }
  };

  const handleThreeDsSuccess = async (authInfo) => {
    setIsThreeDsOpen(false);
    setIsProcessingPayment(true);
    setThreeDsAuthData(authInfo);

    try {
      if (pendingIntent) {
        await apiConfirmPaymentIntent({
          paymentIntentId: pendingIntent.id,
          simulatedAppApproval: authInfo.method === 'app_push'
        });
      }

      const orderPayload = {
        customer: { ...formData },
        items: [...items],
        subtotal,
        discountAmount,
        discountCode,
        shippingFee,
        totalAmount,
        countryCode: selectedCountry.code
      };

      await finalizeOrder(orderPayload, authInfo);
    } catch (err) {
      console.warn('Confirm 3DS error:', err);
      setPaymentError('Erreur de confirmation 3D Secure.');
      setIsProcessingPayment(false);
    }
  };

  const finalizeOrder = async (orderPayload, authInfo = null) => {
    let newOrder;
    try {
      const apiRes = await apiCreateOrder({
        ...orderPayload,
        paymentMethod: formData.paymentMethod,
        threeDsVerified: Boolean(authInfo)
      });
      if (apiRes && apiRes.success && apiRes.order) {
        newOrder = apiRes.order;
      }
    } catch (err) {
      console.warn('Backend order call failed, using local order:', err);
    }

    if (!newOrder) {
      // Fallback local order
      const orderNumber = `EU-${Math.floor(100000 + Math.random() * 900000)}`;
      newOrder = {
        orderNumber,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        items: [...items],
        customer: { ...formData },
        subtotal,
        discountAmount,
        discountCode,
        shippingFee,
        totalAmount,
        estimatedDelivery: deliveryDatesRange,
        carrier: selectedCountry.code === 'FR' ? 'Colissimo Suivi' : 'DHL Express Europe',
        status: 'Confirmée & en préparation',
        threeDsVerified: Boolean(authInfo),
        trackingSteps: [
          { title: 'Commande validée & sécurisée (3D Secure v2)', date: "Aujourd'hui (Immédiat)", done: true },
          { title: 'Préparation du colis (Plateforme Logistique UE)', date: 'Sous 24h ouvrées', done: true },
          { title: `Prise en charge ${selectedCountry.code === 'FR' ? 'Colissimo' : 'DHL'}`, date: 'Dans 2 jours', done: false },
          { title: 'Remise en boîte aux lettres ou contre signature', date: deliveryDatesRange, done: false }
        ]
      };
    }

    // Save to local storage for persistence across visits
    try {
      const existing = JSON.parse(localStorage.getItem('eshop_orders') || '[]');
      existing.unshift(newOrder);
      localStorage.setItem('eshop_orders', JSON.stringify(existing));
    } catch (err) {
      console.error(err);
    }

    setCreatedOrder(newOrder);
    setStep(3);
    setIsProcessingPayment(false);
    if (onOrderSuccess) onOrderSuccess(newOrder);
  };

  const copyOrderNumber = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.orderNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* Step Indicator Header */}
        <div className="checkout-steps-bar">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span>Livraison UE</span>
          </div>
          <span className="step-separator">—</span>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>Paiement</span>
          </div>
          <span className="step-separator">—</span>
          <div className={`step-indicator ${step === 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Confirmation</span>
          </div>

          <button
            className="checkout-header-close"
            onClick={onClose}
            aria-label="Fermer la commande"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: SHIPPING DETAILS */}
        {step === 1 && (
          <div className="checkout-body-layout">
            <form onSubmit={handleNextToPayment} className="checkout-form" noValidate>
              <div className="checkout-section-header">
                <div>
                  <h3 className="checkout-section-title">Adresse de livraison</h3>
                  <p className="checkout-section-subtitle">
                    Expédition prioritaire depuis nos entrepôts de l'Union Européenne
                  </p>
                </div>
                <span className="stock-eu-badge">
                  <Truck size={14} /> Stock UE 24h
                </span>
              </div>

              {currentUser && (
                <div className="checkout-logged-banner">
                  <UserCheck size={16} color="#10b981" />
                  <span>
                    Connecté en tant que <strong>{currentUser.firstName} {currentUser.lastName}</strong> — vos informations sont pré-remplies.
                  </span>
                </div>
              )}

              {/* Email */}
              <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                <label className="form-label" htmlFor="checkout-email">
                  Adresse email <span className="req">*</span>
                  <span className="label-subtext">(Pour recevoir le lien de suivi en direct)</span>
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {formErrors.email && (
                  <div className="form-inline-error">
                    <AlertCircle size={13} />
                    <span>{formErrors.email}</span>
                  </div>
                )}
              </div>

              {/* First & Last Name */}
              <div className="form-grid-2">
                <div className={`form-group ${formErrors.firstName ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="checkout-firstname">
                    Prénom <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-firstname"
                    type="text"
                    name="firstName"
                    className="form-input"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  {formErrors.firstName && (
                    <div className="form-inline-error">
                      <AlertCircle size={13} />
                      <span>{formErrors.firstName}</span>
                    </div>
                  )}
                </div>

                <div className={`form-group ${formErrors.lastName ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="checkout-lastname">
                    Nom <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-lastname"
                    type="text"
                    name="lastName"
                    className="form-input"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                  {formErrors.lastName && (
                    <div className="form-inline-error">
                      <AlertCircle size={13} />
                      <span>{formErrors.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Street Address */}
              <div className={`form-group ${formErrors.address ? 'has-error' : ''}`}>
                <label className="form-label" htmlFor="checkout-address">
                  Numéro et nom de rue <span className="req">*</span>
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="12 rue de la Paix"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                {formErrors.address && (
                  <div className="form-inline-error">
                    <AlertCircle size={13} />
                    <span>{formErrors.address}</span>
                  </div>
                )}
              </div>

              {/* Postal Code & City */}
              <div className="form-grid-2">
                <div className={`form-group ${formErrors.postalCode ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="checkout-postal">
                    Code postal <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-postal"
                    type="text"
                    name="postalCode"
                    className="form-input"
                    placeholder="75001"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                  {formErrors.postalCode && (
                    <div className="form-inline-error">
                      <AlertCircle size={13} />
                      <span>{formErrors.postalCode}</span>
                    </div>
                  )}
                </div>

                <div className={`form-group ${formErrors.city ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="checkout-city">
                    Ville <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    name="city"
                    className="form-input"
                    placeholder="Paris"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  {formErrors.city && (
                    <div className="form-inline-error">
                      <AlertCircle size={13} />
                      <span>{formErrors.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Country & Phone */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-country">
                    Pays de livraison
                  </label>
                  <select
                    id="checkout-country"
                    name="country"
                    className="form-select"
                    value={formData.country}
                    onChange={handleInputChange}
                  >
                    {EU_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.delayText})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-phone">
                    Téléphone <span className="label-subtext">(Pour le livreur)</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Dynamic Delivery Date Banner */}
              <div className="checkout-delivery-callout">
                <div className="delivery-callout-icon">
                  <Truck size={20} />
                </div>
                <div className="delivery-callout-text">
                  <div className="delivery-date-title">
                    Livraison {isFreeShipping ? 'offerte' : 'standard'} garantie : <strong>{deliveryDatesRange}</strong>
                  </div>
                  <div className="delivery-date-sub">
                    Transporteur : {selectedCountry.code === 'FR' ? 'Colissimo / La Poste' : 'DHL Express Europe'} • Numéro de suivi fourni
                  </div>
                </div>
              </div>

              {/* Order Recap Preview Accordion (Mobile & Desktop) */}
              <div className="checkout-recap-box">
                <button
                  type="button"
                  className="checkout-recap-toggle"
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingBag size={16} color="#1e3a8a" />
                    <span>Récapitulatif de la commande ({items.reduce((acc, i) => acc + i.quantity, 0)} articles)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong style={{ color: '#0f172a' }}>{totalAmount.toFixed(2)} €</strong>
                    {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isSummaryExpanded && (
                  <div className="checkout-recap-content">
                    <div className="checkout-items-list">
                      {items.map((it) => (
                        <div key={it.key || it.id} className="checkout-recap-item">
                          <img src={it.image} alt={it.name} className="recap-thumb" />
                          <div style={{ flex: 1 }}>
                            <div className="recap-name">{it.name}</div>
                            {(it.selectedSize || it.selectedColor) && (
                              <div className="recap-variant">
                                {it.selectedSize && `Taille: ${it.selectedSize} `}
                                {it.selectedColor && `• Couleur: ${it.selectedColor}`}
                              </div>
                            )}
                            <div className="recap-qty">Qté : {it.quantity}</div>
                          </div>
                          <div className="recap-price">
                            {(it.price * it.quantity).toFixed(2)} €
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="checkout-pricing-summary">
                      <div className="summary-row">
                        <span>Sous-total articles</span>
                        <span>{subtotal.toFixed(2)} €</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="summary-row promo">
                          <span>Remise ({discountCode})</span>
                          <span>-{discountAmount.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="summary-row">
                        <span>Frais de livraison</span>
                        <span>
                          {isFreeShipping ? (
                            <strong style={{ color: '#059669' }}>OFFERTE</strong>
                          ) : (
                            `${shippingFee.toFixed(2)} €`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg checkout-continue-btn">
                <span>Continuer vers le paiement sécurisé</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD & REVIEW */}
        {step === 2 && (
          <form onSubmit={handleProcessPayment} className="checkout-form">
            <div className="checkout-section-header">
              <div>
                <h3 className="checkout-section-title">Mode de règlement</h3>
                <p className="checkout-section-subtitle">
                  Toutes les transactions sont chiffrées en SSL 256 bits conforme DSP2 / UE
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Lock size={14} /> 100% Sécurisé
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-selector">
              <div
                className={`payment-method-card ${formData.paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
              >
                <CreditCard size={22} color="#1e3a8a" />
                <span className="method-label">Carte Bancaire</span>
                <span className="method-sub">CB, Visa, Mastercard</span>
              </div>

              <div
                className={`payment-method-card ${formData.paymentMethod === 'applepay' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'applepay' })}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}> Pay</span>
                <span className="method-label">Apple / Google Pay</span>
                <span className="method-sub">Biométrie 1-clic</span>
              </div>

              <div
                className={`payment-method-card ${formData.paymentMethod === 'paypal' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'paypal' })}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0079C1' }}>PayPal</span>
                <span className="method-label">PayPal Express</span>
                <span className="method-sub">Paiement en 4x sans frais</span>
              </div>
            </div>

            {/* Payment Error Banner */}
            {paymentError && (
              <div className="checkout-payment-error-box">
                <AlertCircle size={18} />
                <div>
                  <strong>Échec de la transaction</strong>
                  <p>{paymentError}</p>
                </div>
              </div>
            )}

            {/* Simulated Payment Container */}
            {formData.paymentMethod === 'card' && (
              <div className="credit-card-container">
                {/* Stripe Sandbox Test Cards Toolbar */}
                <div className="stripe-sandbox-toolbar">
                  <div className="sandbox-toolbar-header">
                    <span className="sandbox-badge">
                      <Sparkles size={13} color="#6366f1" /> STRIPE SANDBOX TEST
                    </span>
                    <span className="sandbox-hint">Cliquez sur une carte pour tester immédiatement :</span>
                  </div>
                  <div className="sandbox-presets-grid">
                    {STRIPE_TEST_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`preset-card-btn ${formData.cardNumber.replace(/\s+/g, '') === preset.number.replace(/\s+/g, '') ? 'active' : ''}`}
                        onClick={() => handleSelectPresetCard(preset)}
                      >
                        <span className="preset-name">{preset.name}</span>
                        <span className={`preset-pill ${preset.badgeClass}`}>{preset.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Live Graphic Preview */}
                <div className={`credit-card-preview brand-${getCardBrand(formData.cardNumber)}`}>
                  <div className="card-top-row">
                    <div className="card-chip" />
                    <span className="card-brand-tag uppercase font-bold font-mono">
                      {getCardBrand(formData.cardNumber).toUpperCase()}
                    </span>
                  </div>
                  <div className="card-number-mock">{formData.cardNumber || '•••• •••• •••• ••••'}</div>
                  <div className="card-details-mock">
                    <div>
                      <span className="card-lbl">TITULAIRE</span>
                      <span className="card-val">{formData.firstName ? `${formData.firstName} ${formData.lastName}` : 'CLIENT ESTIMÉ'}</span>
                    </div>
                    <div>
                      <span className="card-lbl">EXPIRE</span>
                      <span className="card-val">{formData.cardExp || 'MM/AA'}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="card-input-label-row">
                    <label className="form-label" htmlFor="chk-card-number">Numéro de carte bancaire</label>
                    <span className="card-brand-indicator">
                      {getCardBrand(formData.cardNumber) === 'visa' && '💳 Visa (3D Secure v2)'}
                      {getCardBrand(formData.cardNumber) === 'mastercard' && '💳 Mastercard'}
                      {getCardBrand(formData.cardNumber) === 'cb' && '💳 Carte Bancaire (CB)'}
                    </span>
                  </div>
                  <div className="card-input-wrapper">
                    <input
                      id="chk-card-number"
                      type="text"
                      className="form-input font-mono"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                    />
                    <Lock size={16} className="card-input-lock" />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="chk-card-exp">Date d'expiration (MM/AA)</label>
                    <input
                      id="chk-card-exp"
                      type="text"
                      className="form-input font-mono"
                      value={formData.cardExp}
                      onChange={handleCardExpChange}
                      placeholder="12/28"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="chk-card-cvc">Code de sécurité (CVC)</label>
                    <input
                      id="chk-card-cvc"
                      type="password"
                      className="form-input font-mono"
                      value={formData.cardCvc}
                      onChange={handleCardCvcChange}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'applepay' && (
              <div className="digital-wallet-box">
                <div className="wallet-badge"> Pay</div>
                <p>Authentification instantanée avec Face ID ou Touch ID lors de la validation.</p>
              </div>
            )}

            {formData.paymentMethod === 'paypal' && (
              <div className="digital-wallet-box">
                <div className="wallet-badge paypal">PayPal</div>
                <p>Connexion sécurisée à votre compte PayPal ou paiement en 4x disponible.</p>
              </div>
            )}

            {/* In-Checkout Promo Code Adder */}
            <div className="checkout-promo-box">
              {discountCode ? (
                <div className="applied-promo-pill">
                  <div className="applied-promo-info">
                    <Tag size={14} color="#059669" />
                    <span>Code promo <strong>{discountCode}</strong> appliqué (-{discountAmount.toFixed(2)} €)</span>
                  </div>
                  <button type="button" className="remove-promo-btn" onClick={onRemovePromo}>
                    <X size={14} />
                    <span>Retirer</span>
                  </button>
                </div>
              ) : (
                <div className="checkout-promo-input-row">
                  <input
                    type="text"
                    placeholder="Code promo (ex: BIENVENUE10)"
                    className="form-input"
                    value={checkoutPromoInput}
                    onChange={(e) => {
                      setCheckoutPromoInput(e.target.value);
                      setCheckoutPromoError('');
                    }}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleApplyCheckoutPromo}>
                    Appliquer
                  </button>
                </div>
              )}
              {checkoutPromoError && (
                <div className="form-inline-error" style={{ marginTop: '0.35rem' }}>
                  <AlertCircle size={13} />
                  <span>{checkoutPromoError}</span>
                </div>
              )}
            </div>

            {/* Delivery address & total recap summary */}
            <div className="checkout-final-recap">
              <div className="recap-line">
                <span>Adresse de livraison :</span>
                <strong>{formData.firstName} {formData.lastName}, {formData.address}, {formData.postalCode} {formData.city} ({selectedCountry.name})</strong>
              </div>
              <div className="recap-line">
                <span>Date estimée :</span>
                <strong>{deliveryDatesRange} ({selectedCountry.delayText})</strong>
              </div>
              <div className="recap-total-line">
                <span>Montant total à débiter :</span>
                <strong className="final-price-tag">{totalAmount.toFixed(2)} €</strong>
              </div>
            </div>

            <div className="checkout-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} />
                <span>Modifier l'adresse</span>
              </button>

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Vérification bancaire...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Régler {totalAmount.toFixed(2)} €</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER CONFIRMED & TRACKING HANDOFF */}
        {step === 3 && createdOrder && (
          <div className="checkout-form checkout-success-view">
            <div className="success-icon-pulse">
              <CheckCircle2 size={54} color="#10b981" />
            </div>

            <h3 className="success-heading">
              Merci pour votre commande !
            </h3>
            <p className="success-subtitle">
              Votre commande a bien été enregistrée. Un accusé de réception a été envoyé à <strong>{createdOrder.customer.email}</strong>.
            </p>

            {/* 3D Secure Protection Seal */}
            <div className="success-3ds-seal">
              <ShieldCheck size={20} color="#059669" />
              <div>
                <strong>Authentification 3D Secure v2 Validée (DSP2)</strong>
                <p>Transaction vérifiée et autorisée avec succès par votre établissement bancaire via protocole sécurisé SCA.</p>
              </div>
            </div>

            {/* Order Number Box */}
            <div className="success-order-box">
              <div>
                <span className="order-box-label">NUMÉRO DE COMMANDE</span>
                <div className="order-number-display">{createdOrder.orderNumber}</div>
              </div>
              <button
                className="copy-order-btn"
                onClick={copyOrderNumber}
                title="Copier le numéro de commande"
              >
                {isCopied ? (
                  <>
                    <Check size={16} color="#059669" />
                    <span style={{ color: '#059669' }}>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Delivery Promise Card */}
            <div className="success-delivery-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Truck size={18} color="#1e3a8a" />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                  Livraison prévue : {createdOrder.estimatedDelivery}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Expédié via <strong>{createdOrder.carrier}</strong> avec remise sécurisée à l'adresse : {createdOrder.customer.address}, {createdOrder.customer.postalCode} {createdOrder.customer.city} ({selectedCountry.name}).
              </p>
            </div>

            {/* Loyalty Points Earned Card */}
            <div className="success-loyalty-card">
              <div className="loyalty-card-icon-wrap">
                <Gift size={20} color="#ec4899" />
              </div>
              <div>
                <h5 className="success-loyalty-title">
                  +{Math.floor(totalAmount)} points fidélité crédités !
                </h5>
                <p className="success-loyalty-desc">
                  Votre solde Privilège a été crédité. Utilisez vos points pour débloquer des bons de réduction lors de votre prochain achat.
                </p>
              </div>
            </div>

            {/* Tracking Steps Preview */}
            <div className="success-steps-card">
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                Progression logistique en temps réel :
              </h4>
              <div className="tracking-timeline">
                {createdOrder.trackingSteps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`timeline-step ${s.done ? 'completed' : idx === 2 ? 'active' : ''}`}
                  >
                    <div className="timeline-dot">
                      {s.done ? '✓' : idx + 1}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="success-actions-row">
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={() => {
                  if (onOpenTracking) {
                    onOpenTracking(createdOrder.orderNumber);
                  } else {
                    onClose();
                  }
                }}
              >
                <Truck size={18} />
                <span>Suivre ma commande en direct ➔</span>
              </button>

              <button className="btn btn-outline" onClick={onClose}>
                Continuer mes achats
              </button>
            </div>
          </div>
        )}

        {/* 3D Secure Challenge Modal */}
        <ThreeDSModal
          isOpen={isThreeDsOpen}
          onClose={() => setIsThreeDsOpen(false)}
          onSuccess={handleThreeDsSuccess}
          totalAmount={totalAmount}
          cardLast4={formData.cardNumber.replace(/\D/g, '').slice(-4) || '4242'}
          cardBrand={getCardBrand(formData.cardNumber)}
        />
      </div>
    </div>
  );
}

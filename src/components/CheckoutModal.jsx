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
  Sparkles,
  Mail,
  ExternalLink
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { PROMO_CODES } from '../data/promoCodes';
import { apiCreateOrder, apiCreateCheckoutSession, apiCreatePaymentIntent } from '../services/api';
import { firebaseCreateOrder } from '../services/firebase';

const stripePublishableKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY) || '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
    paymentMethod: 'stripe'
  });

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

  // Wallet availability reported directly by Stripe SDK (Apple Pay, Google Pay)
  const [stripeWallets, setStripeWallets] = useState({
    applePay: false,
    googlePay: false
  });

  // Stripe Payment Element integration state
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const [isInitializingStripe, setIsInitializingStripe] = useState(false);
  const [elementsInstance, setElementsInstance] = useState(null);
  const [isElementMounted, setIsElementMounted] = useState(false);

  // Form, promo, order & UI states
  const [formErrors, setFormErrors] = useState({});
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [checkoutPromoInput, setCheckoutPromoInput] = useState('');
  const [checkoutPromoError, setCheckoutPromoError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Ask Stripe if Apple Pay / Google Pay are actually available for this device, merchant & currency
  React.useEffect(() => {
    if (!stripePromise) return;
    let isMounted = true;

    stripePromise.then(async (stripe) => {
      if (!stripe || !isMounted) return;
      try {
        const pr = stripe.paymentRequest({
          country: selectedCountry?.code || 'FR',
          currency: 'eur',
          total: {
            label: 'Commande eShopStore',
            amount: Math.max(100, Math.round(totalAmount * 100))
          },
          requestPayerName: true,
          requestPayerEmail: true
        });

        const res = await pr.canMakePayment();
        if (isMounted) {
          setStripeWallets({
            applePay: Boolean(res && res.applePay),
            googlePay: Boolean(res && res.googlePay)
          });
        }
      } catch {
        if (isMounted) {
          setStripeWallets({ applePay: false, googlePay: false });
        }
      }
    }).catch(() => {
      if (isMounted) setStripeWallets({ applePay: false, googlePay: false });
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry?.code, totalAmount]);

  // Mount official Stripe Payment Element when entering Step 2
  React.useEffect(() => {
    if (step !== 2) return;
    let isCancelled = false;

    async function initStripeElements() {
      setIsInitializingStripe(true);
      setPaymentError('');

      try {
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

        const res = await apiCreatePaymentIntent(orderPayload);
        if (isCancelled) return;

        if (res && res.success && res.clientSecret) {
          setPaymentIntentData(res);
          const stripe = await stripePromise;
          if (!stripe) {
            setIsInitializingStripe(false);
            return;
          }

          const elements = stripe.elements({
            clientSecret: res.clientSecret,
            appearance: {
              theme: 'flat',
              variables: {
                colorPrimary: '#1e3a8a',
                colorBackground: '#ffffff',
                colorText: '#0f172a',
                colorDanger: '#ef4444',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px'
              }
            }
          });

          const paymentElement = elements.create('payment', {
            layout: 'tabs',
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto'
              }
            }
          });

          setTimeout(() => {
            if (isCancelled) return;
            const mountPoint = document.getElementById('stripe-payment-element-mount');
            if (mountPoint) {
              mountPoint.innerHTML = '';
              paymentElement.mount(mountPoint);
              paymentElement.on('ready', () => {
                if (!isCancelled) {
                  setIsElementMounted(true);
                  setIsInitializingStripe(false);
                }
              });
              paymentElement.on('change', (ev) => {
                if (ev.error) {
                  setPaymentError(ev.error.message);
                } else {
                  setPaymentError('');
                }
              });
              setElementsInstance(elements);
            } else {
              setIsInitializingStripe(false);
            }
          }, 80);
        } else {
          setIsInitializingStripe(false);
          // Keep checkout redirect option available
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error mounting Stripe Payment Element:', err);
          setIsInitializingStripe(false);
        }
      }
    }

    initStripeElements();

    return () => {
      isCancelled = true;
    };
  }, [step]);

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

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (isProcessingPayment) return; // Prevent duplicate submissions
    setIsProcessingPayment(true);
    setPaymentError('');

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

    // 1. If Stripe Payment Element is initialized and mounted, confirm payment directly through Stripe
    if (elementsInstance && paymentIntentData?.orderNumber) {
      try {
        const stripe = await stripePromise;
        const returnUrl = `${window.location.origin}/?payment_status=success&session_id=${paymentIntentData.paymentIntentId || ''}&order_number=${paymentIntentData.orderNumber}`;

        const { error } = await stripe.confirmPayment({
          elements: elementsInstance,
          confirmParams: {
            return_url: returnUrl,
            receipt_email: formData.email,
            payment_method_data: {
              billing_details: {
                name: `${formData.firstName} ${formData.lastName}`.trim() || undefined,
                email: formData.email,
                phone: formData.phone || undefined,
                address: {
                  line1: formData.address || undefined,
                  postal_code: formData.postalCode || undefined,
                  city: formData.city || undefined,
                  country: selectedCountry.code || 'FR'
                }
              }
            }
          }
        });

        if (error) {
          // Display Stripe error directly from Stripe
          setPaymentError(error.message || 'La transaction n\'a pas pu être validée.');
          setIsProcessingPayment(false);
          return;
        }
      } catch (err) {
        console.error('Stripe Payment Element confirmation error:', err);
        setPaymentError('Erreur de communication avec Stripe. Vous pouvez également régler via la page hébergée Stripe Checkout.');
        setIsProcessingPayment(false);
        return;
      }
    } else {
      // 2. Fallback to Stripe Hosted Checkout
      try {
        const sessionRes = await apiCreateCheckoutSession(orderPayload);
        if (sessionRes && sessionRes.success && sessionRes.url) {
          localStorage.setItem('eshop_pending_order', sessionRes.orderNumber);
          window.location.href = sessionRes.url;
          return;
        } else if (sessionRes && sessionRes.error) {
          setPaymentError(sessionRes.error);
          setIsProcessingPayment(false);
          return;
        } else {
          setPaymentError('Impossible d’initialiser le paiement sécurisé Stripe. Veuillez réessayer.');
          setIsProcessingPayment(false);
          return;
        }
      } catch (sessionErr) {
        console.error('Stripe Checkout connection error:', sessionErr);
        setPaymentError('Erreur de communication avec la passerelle Stripe. Veuillez vérifier votre connexion.');
        setIsProcessingPayment(false);
        return;
      }
    }
  };

  const handleHostedCheckoutRedirect = async () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaymentError('');

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

    try {
      const sessionRes = await apiCreateCheckoutSession(orderPayload);
      if (sessionRes && sessionRes.success && sessionRes.url) {
        localStorage.setItem('eshop_pending_order', sessionRes.orderNumber);
        window.location.href = sessionRes.url;
      } else {
        setPaymentError(sessionRes?.error || 'Impossible d\'initialiser Stripe Checkout.');
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error('Stripe redirect error:', err);
      setPaymentError('Erreur de connexion avec Stripe.');
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

    // Synchronize order with Cloud Firestore
    try {
      firebaseCreateOrder({
        orderNumber: newOrder.orderNumber,
        customer_email: formData.email,
        customer_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        items_count: items.length,
        total_amount: totalAmount,
        currency: 'EUR',
        payment_method: formData.paymentMethod,
        carrier: newOrder.carrier,
        delivery_dates: deliveryDatesRange,
        status: 'confirmed'
      });
    } catch (fbErr) {
      console.warn('[Firestore] Sync order failed:', fbErr.message);
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
        )}

        {/* STEP 2: PAYMENT METHOD & REVIEW */}
        {step === 2 && (
          <form onSubmit={handleProcessPayment} className="checkout-form">
            <div className="checkout-section-header">
              <div>
                <h3 className="checkout-section-title">Paiement sécurisé</h3>
                <p className="checkout-section-subtitle">
                  Votre paiement est traité de manière sécurisée par Stripe.
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Lock size={14} /> Paiement sécurisé par Stripe
              </span>
            </div>

            {/* Payment & Inventory Error Banner */}
            {paymentError && (
              <div className="checkout-payment-error-box" role="alert">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <strong>
                    {paymentError.includes('panier') || paymentError.includes('disponible') || paymentError.includes('stock')
                      ? 'Disponibilité des articles'
                      : 'Validation du paiement'}
                  </strong>
                  <p style={{ marginTop: '0.25rem', lineHeight: 1.45 }}>{paymentError}</p>
                  {(paymentError.includes('panier') || paymentError.includes('disponible') || paymentError.includes('stock')) && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#b91c1c' }}
                      >
                        Modifier mon panier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Single Unified Stripe Official Payment Showcase */}
            <div className="real-stripe-payment-card">
              <div className="stripe-header-badge">
                <div className="stripe-official-logo">
                  <span className="stripe-brand-text">stripe</span>
                  <span className="stripe-certified-tag">PASSERELLE SÉCURISÉE</span>
                </div>
                <span className="stripe-secure-indicator">
                  <ShieldCheck size={14} color="#059669" /> Chiffrement direct Stripe
                </span>
              </div>

              <div className="stripe-card-body">
                <p className="stripe-description">
                  Vos données de paiement sont traitées directement par Stripe. Aucune coordonnée bancaire ne transite ni n'est stockée sur notre boutique.
                </p>

                <div className="stripe-methods-available-block">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', marginBottom: '0.45rem' }}>
                    Cartes et méthodes acceptées via Stripe :
                  </div>
                  <div className="accepted-cards-row">
                    <span className="accepted-card-pill">💳 Carte Bancaire (CB)</span>
                    <span className="accepted-card-pill">Visa</span>
                    <span className="accepted-card-pill">Mastercard</span>
                    <span className="accepted-card-pill">American Express</span>
                    {stripeWallets.applePay && (
                      <span className="accepted-card-pill" style={{ color: '#0f172a', fontWeight: 700 }}>
                         Apple Pay
                      </span>
                    )}
                    {stripeWallets.googlePay && (
                      <span className="accepted-card-pill" style={{ color: '#0f172a', fontWeight: 700 }}>
                        Google Pay
                      </span>
                    )}
                  </div>
                </div>

                <div className="stripe-trust-highlights">
                  <div className="trust-highlight-item">
                    <Lock size={14} color="#38bdf8" />
                    <span><strong>Paiement sécurisé par Stripe</strong> : Vos données de paiement sont traitées directement par Stripe.</span>
                  </div>
                  <div className="trust-highlight-item">
                    <ShieldCheck size={14} color="#10b981" />
                    <span><strong>Authentification renforcée</strong> : Votre banque peut demander une validation supplémentaire lorsque nécessaire.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Real Stripe Payment Component */}
            <div className="stripe-element-container-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                  Coordonnées de paiement
                </span>
                <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <Lock size={13} color="#059669" /> Formulaire sécurisé Stripe
                </span>
              </div>

              {isInitializingStripe && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <RefreshCw size={18} className="spin-icon" color="#1e3a8a" />
                  <span>Chargement sécurisé du formulaire Stripe...</span>
                </div>
              )}

              <div id="stripe-payment-element-mount" style={{ minHeight: isInitializingStripe ? '0px' : '150px' }} />

              <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleHostedCheckoutRedirect}
                  disabled={isProcessingPayment}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    fontSize: '0.8125rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  Ou payer sur la page sécurisée Stripe Checkout →
                </button>
              </div>
            </div>

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
                    <span>Redirection vers Stripe sécurisé...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Payer {totalAmount.toFixed(2)} € avec Stripe</span>
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

            {/* Stripe Payment Confirmation Seal */}
            <div className="success-3ds-seal">
              <ShieldCheck size={20} color="#059669" />
              <div>
                <strong>Paiement sécurisé par Stripe validé</strong>
                <p>Votre transaction a été traitée directement et en toute sécurité par la passerelle Stripe.</p>
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

            {/* Email Notification & Web Preview Card */}
            <div className="success-delivery-card" style={{ borderLeft: '4px solid #2563eb', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} color="#2563eb" />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                    Email de confirmation & facture envoyé
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
                  ✓ Facture acquittée & TVA 20%
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                Un récapitulatif détaillé avec facture officielle, détail TVA et lien de suivi en direct a été envoyé à <strong>{createdOrder.customer?.email}</strong>.
              </p>
              {createdOrder.emailPreviewUrl && (
                <div style={{ marginTop: '0.25rem' }}>
                  <a
                    href={createdOrder.emailPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8125rem',
                      color: '#2563eb',
                      borderColor: '#93c5fd',
                      background: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>👁️ Ouvrir l'aperçu web de l'email (Sandbox Ethereal)</span>
                  </a>
                </div>
              )}
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
      </div>
    </div>
  );
}

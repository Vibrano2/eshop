import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  Gift,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Truck,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Download,
  Printer,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Share2,
  RotateCcw
} from 'lucide-react';
import { apiGetUserOrders, apiUpdateProfile, apiChangePassword, apiResendOrderEmail, apiGetUserReturns } from '../services/api';
import InvoiceModal from './InvoiceModal';
import ReturnRequestModal from './ReturnRequestModal';

export default function AccountPage({
  currentUser,
  onUpdateUser,
  onLogout,
  onNavigateHome,
  onOpenShop,
  onOpenTrackingWithOrder,
  onOpenLoyalty,
  onAddToCart,
  onOpenAuth,
  initialTab = 'orders'
}) {
  // Active Tab
  const [activeTab, setActiveTab] = useState(initialTab || 'orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Selected Order for Invoice
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Returns & RMA State
  const [returnsList, setReturnsList] = useState([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);
  const [returnOrderModal, setReturnOrderModal] = useState(null);
  const [viewingReturnLabelRma, setViewingReturnLabelRma] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    postalCode: currentUser?.postalCode || '',
    city: currentUser?.city || '',
    countryCode: currentUser?.countryCode || 'FR'
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');

  // Referral Copy Toast
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Email Resend State
  const [resendingEmailOrderNumber, setResendingEmailOrderNumber] = useState(null);
  const [emailResendFeedback, setEmailResendFeedback] = useState(null);

  // Synchronize profile form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        postalCode: currentUser.postalCode || '',
        city: currentUser.city || '',
        countryCode: currentUser.countryCode || 'FR'
      });
    }
  }, [currentUser]);

  // Load orders on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingOrders(true);
    apiGetUserOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data || []);
          setIsLoadingOrders(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Orders fetch error:', err);
          setOrdersError('Impossible de charger vos commandes.');
          setIsLoadingOrders(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load returns on mount or update
  const loadUserReturns = () => {
    setIsLoadingReturns(true);
    apiGetUserReturns()
      .then((data) => setReturnsList(data || []))
      .catch((err) => console.warn('Returns fetch error:', err))
      .finally(() => setIsLoadingReturns(false));
  };

  useEffect(() => {
    if (currentUser) {
      loadUserReturns();
    }
  }, [currentUser]);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await apiUpdateProfile(profileForm);
      if (res.success) {
        setProfileSuccessMsg('Vos coordonnées et adresse de livraison ont été mises à jour avec succès.');
        if (onUpdateUser && res.user) {
          onUpdateUser({
            ...currentUser,
            ...res.user
          });
        }
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg(res.error || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      setProfileErrorMsg('Erreur réseau. Modifications enregistrées localement.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccessMsg('');
    setPwErrorMsg('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwErrorMsg('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPwErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await apiChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        setPwSuccessMsg('Votre mot de passe a été modifié avec succès !');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPwSuccessMsg(''), 4000);
      } else {
        setPwErrorMsg(res.error || 'Impossible de modifier le mot de passe.');
      }
    } catch (err) {
      setPwErrorMsg('Erreur lors de la modification.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // Copy Referral Code
  const handleCopyCode = () => {
    const code = currentUser?.loyaltyCode || 'ESHOP-EU2026';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Copy Referral Link
  const handleCopyLink = () => {
    const code = currentUser?.loyaltyCode || 'ESHOP-EU2026';
    const link = `https://eshopstore.shop?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    const matchNum = o.orderNumber?.toLowerCase().includes(q);
    const matchItem = o.items?.some((i) =>
      (i.product_name || i.name || '').toLowerCase().includes(q)
    );
    return matchNum || matchItem;
  });

  // Re-add order items to cart
  const handleReorder = (order) => {
    if (!order.items || !onAddToCart) return;
    order.items.forEach((item) => {
      onAddToCart(
        {
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          price: Number(item.unit_price || item.price || 0),
          image: item.image_url || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
        },
        item.quantity || 1,
        item.variant || null
      );
    });
  };

  // Resend order confirmation and invoice email
  const handleResendEmail = async (order) => {
    setResendingEmailOrderNumber(order.orderNumber);
    setEmailResendFeedback(null);
    try {
      const res = await apiResendOrderEmail(order.orderNumber);
      if (res && res.success) {
        setEmailResendFeedback({
          orderNumber: order.orderNumber,
          message: res.message || 'Email de confirmation et facture envoyé avec succès !',
          previewUrl: res.previewUrl
        });
      } else {
        alert(res?.error || 'Erreur lors du renvoi de l’email.');
      }
    } catch (err) {
      alert('Erreur lors du renvoi de l’email : ' + err.message);
    } finally {
      setResendingEmailOrderNumber(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="account-status-badge delivered"><CheckCircle size={13} /> Livré</span>;
      case 'shipped':
        return <span className="account-status-badge shipped"><Truck size={13} /> En cours de livraison</span>;
      case 'preparing':
        return <span className="account-status-badge preparing"><Clock size={13} /> En préparation</span>;
      case 'paid':
        return <span className="account-status-badge paid"><CheckCircle size={13} /> Payée - Confirmée</span>;
      default:
        return <span className="account-status-badge default">{status || 'Confirmée'}</span>;
    }
  };

  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="account-page-container">
      {/* Breadcrumb Navigation */}
      <div className="account-breadcrumb-bar">
        <div className="container">
          <nav className="account-breadcrumb" aria-label="Fil d'Ariane">
            <button onClick={onNavigateHome} className="breadcrumb-link">
              Accueil
            </button>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-current">Mon Compte & Commandes</span>
          </nav>
        </div>
      </div>

      <div className="container">
        {!currentUser ? (
          <div className="account-guest-prompt">
            <div className="guest-prompt-icon">
              <User size={42} />
            </div>
            <h2>Bienvenue sur votre Espace Client</h2>
            <p>
              Connectez-vous pour consulter l'historique de vos commandes, suivre l'acheminement de vos colis en temps réel, télécharger vos factures et cumuler vos points fidélité.
            </p>
            <div className="guest-prompt-actions">
              <button
                className="guest-btn-login"
                onClick={() => onOpenAuth && onOpenAuth('login')}
              >
                <User size={18} />
                <span>Se connecter à mon compte</span>
              </button>
              <button
                className="guest-btn-register"
                onClick={() => onOpenAuth && onOpenAuth('register')}
              >
                <Sparkles size={18} color="#ec4899" />
                <span>Créer un compte (+50 pts offerts)</span>
              </button>
            </div>
            <div className="guest-prompt-footer">
              <button onClick={onNavigateHome} className="guest-link-home">
                ← Retourner faire mes achats
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Customer Header Card */}
            <section className="account-hero-card">
              <div className="account-hero-main">
            <div className="account-avatar-large">
              <span>{initials || 'ES'}</span>
            </div>
            <div className="account-identity">
              <div className="account-name-row">
                <h1 className="account-user-name">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Mon Espace Client'}
                </h1>
                <span className="account-verified-tag">
                  <ShieldCheck size={14} /> Compte Vérifié UE
                </span>
                {currentUser?.role === 'admin' && (
                  <span className="account-admin-badge">Admin</span>
                )}
              </div>
              <div className="account-meta-details">
                <span className="account-meta-item">
                  <Mail size={14} /> {currentUser?.email || 'client@eshopstore.shop'}
                </span>
                {currentUser?.city && (
                  <span className="account-meta-item">
                    <MapPin size={14} /> {currentUser.city}, {currentUser.countryCode || 'FR'}
                  </span>
                )}
                <span className="account-meta-item">
                  <Sparkles size={14} color="#f59e0b" /> Membre Club Privilège
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="account-kpis-grid">
            <div
              className="account-kpi-tile clickable"
              onClick={() => setActiveTab('orders')}
              title="Voir mes commandes"
            >
              <div className="account-kpi-icon orders-color">
                <Package size={22} />
              </div>
              <div className="account-kpi-data">
                <span className="kpi-value">{orders.length}</span>
                <span className="kpi-label">Commandes passées</span>
              </div>
            </div>

            <div
              className="account-kpi-tile clickable"
              onClick={() => onOpenLoyalty && onOpenLoyalty()}
              title="Voir mon solde et mes récompenses fidélité"
            >
              <div className="account-kpi-icon loyalty-color">
                <Gift size={22} />
              </div>
              <div className="account-kpi-data">
                <span className="kpi-value">{currentUser?.loyaltyPoints || 50} pts</span>
                <span className="kpi-label">Fidélité (échangeable)</span>
              </div>
            </div>

            <div className="account-kpi-tile referral-tile">
              <div className="account-kpi-icon referral-color">
                <Share2 size={22} />
              </div>
              <div className="account-kpi-data">
                <div className="referral-code-display">
                  <span className="kpi-value font-mono">
                    {currentUser?.loyaltyCode || 'ESHOP-EU4821'}
                  </span>
                  <button
                    className="account-copy-icon-btn"
                    onClick={handleCopyCode}
                    title="Copier mon code parrain"
                  >
                    {copiedCode ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  </button>
                </div>
                <span className="kpi-label">Code parrainage (-5€)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Tabs Navigation */}
        <div className="account-tabs-wrapper">
          <nav className="account-tabs-nav" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'orders'}
              className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              <span>Mes Commandes & Colis</span>
              <span className="tab-counter-badge">{orders.length}</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'profile'}
              className={`account-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <MapPin size={18} />
              <span>Coordonnées & Livraison</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'loyalty'}
              className={`account-tab-btn ${activeTab === 'loyalty' ? 'active' : ''}`}
              onClick={() => setActiveTab('loyalty')}
            >
              <Gift size={18} />
              <span>Fidélité & Parrainage</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'returns'}
              className={`account-tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <RotateCcw size={18} />
              <span>Retours & SAV</span>
              {returnsList.length > 0 && (
                <span className="tab-counter-badge returns-badge">{returnsList.length}</span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'security'}
              className={`account-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              <span>Sécurité & Compte</span>
            </button>
          </nav>
        </div>

        {/* TAB 1: ORDERS & TRACKING */}
        {activeTab === 'orders' && (
          <div className="account-tab-content">
            <div className="account-section-header">
              <div>
                <h2>Historique de vos commandes</h2>
                <p>Suivez l'acheminement de vos colis en direct et téléchargez vos factures d'achat officielles.</p>
              </div>
              {orders.length > 0 && (
                <div className="account-search-orders">
                  <input
                    type="search"
                    placeholder="Rechercher une commande, produit..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="account-input-search"
                  />
                </div>
              )}
            </div>

            {/* Email resend feedback alert */}
            {emailResendFeedback && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle size={18} color="#2563eb" />
                  <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                    {emailResendFeedback.message} (Commande #{emailResendFeedback.orderNumber})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {emailResendFeedback.previewUrl && (
                    <a
                      href={emailResendFeedback.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{
                        background: '#ffffff',
                        color: '#2563eb',
                        borderColor: '#93c5fd',
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.6rem'
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Voir l'email (Sandbox Ethereal)</span>
                    </a>
                  )}
                  <button
                    onClick={() => setEmailResendFeedback(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {isLoadingOrders ? (
              <div className="account-loading-state">
                <RefreshCw size={28} className="spin-icon" />
                <p>Chargement de vos commandes...</p>
              </div>
            ) : ordersError ? (
              <div className="account-error-box">
                <AlertCircle size={20} />
                <span>{ordersError}</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="account-empty-orders">
                <div className="empty-icon-circle">
                  <ShoppingBag size={36} />
                </div>
                <h3>{orderSearch ? 'Aucune commande trouvée' : 'Vous n’avez pas encore passé de commande'}</h3>
                <p>
                  {orderSearch
                    ? 'Essayez de modifier votre terme de recherche.'
                    : 'Découvrez notre catalogue de gadgets pratiques du quotidien et profitez de la livraison rapide dans toute l’Union Européenne.'}
                </p>
                <button
                  className="account-btn-cta"
                  onClick={() => onOpenShop && onOpenShop('all')}
                >
                  Découvrir les incontournables <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="account-orders-list">
                {filteredOrders.map((order) => {
                  const orderDate = order.date
                    ? new Date(order.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Date récente';

                  const items = order.items || [];
                  const totalFormatted = Number(order.totalAmount || 0).toFixed(2);

                  return (
                    <article key={order.orderNumber} className="account-order-card">
                      {/* Order Card Header */}
                      <header className="account-order-header">
                        <div className="order-primary-info">
                          <span className="order-number-title font-mono font-bold">
                            #{order.orderNumber}
                          </span>
                          <span className="order-date-text">Commandé le {orderDate}</span>
                          <span className="carrier-pill">
                            <Truck size={13} /> {order.carrier || 'Colissimo Europe'}
                          </span>
                        </div>
                        <div className="order-header-right">
                          {getStatusBadge(order.status)}
                          <span className="order-total-highlight">{totalFormatted} €</span>
                        </div>
                      </header>

                      {/* Order Items Preview */}
                      <div className="account-order-body">
                        <div className="order-items-scroll">
                          {items.map((item, idx) => (
                            <div key={item.id || idx} className="order-item-row">
                              <img
                                src={item.image_url || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                                alt={item.product_name || item.name}
                                className="order-item-thumb"
                                loading="lazy"
                              />
                              <div className="order-item-details">
                                <h4 className="order-item-name">{item.product_name || item.name}</h4>
                                {item.variant && (
                                  <span className="order-item-variant">Option : {item.variant}</span>
                                )}
                                <span className="order-item-qty">
                                  Quantité : <strong>{item.quantity || 1}</strong> × {Number(item.unit_price || item.price || 0).toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Address snippet */}
                        <div className="order-delivery-snippet">
                          <span className="snippet-title">Adresse d'expédition :</span>
                          <p>
                            {order.customerFirstName} {order.customerLastName}<br />
                            {order.shippingAddress || 'Adresse enregistrée'}<br />
                            {order.postalCode} {order.city} ({order.countryCode || 'FR'})
                          </p>
                        </div>
                      </div>

                      {/* Order Actions Footer */}
                      <footer className="account-order-footer">
                        <button
                          className="account-btn-action primary"
                          onClick={() => onOpenTrackingWithOrder && onOpenTrackingWithOrder(order.orderNumber)}
                        >
                          <Truck size={15} />
                          <span>Suivre le colis</span>
                        </button>

                        <button
                          className="account-btn-action secondary"
                          onClick={() => setSelectedInvoiceOrder(order)}
                        >
                          <Download size={15} />
                          <span>Facture PDF</span>
                        </button>

                        <button
                          className="account-btn-action outline"
                          onClick={() => handleResendEmail(order)}
                          disabled={resendingEmailOrderNumber === order.orderNumber}
                          title="Renvoyer l'email de confirmation et de facture"
                        >
                          {resendingEmailOrderNumber === order.orderNumber ? (
                            <>
                              <RefreshCw size={14} className="spin-icon" />
                              <span>Envoi...</span>
                            </>
                          ) : (
                            <>
                              <Mail size={14} />
                              <span>Renvoyer l'email</span>
                            </>
                          )}
                        </button>

                        <button
                          className="account-btn-action outline"
                          onClick={() => handleReorder(order)}
                          title="Ajouter tous les articles de cette commande à mon panier"
                        >
                          <RefreshCw size={14} />
                          <span>Commander à nouveau</span>
                        </button>

                        <button
                          className="account-btn-action outline return-trigger-btn"
                          onClick={() => setReturnOrderModal(order)}
                          title="Faire une demande de retour ou SAV (garantie 30 jours UE)"
                        >
                          <RotateCcw size={14} />
                          <span>Retour / SAV</span>
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & DELIVERY ADDRESS */}
        {activeTab === 'profile' && (
          <div className="account-tab-content">
            <div className="account-section-header">
              <div>
                <h2>Coordonnées & Adresse de livraison</h2>
                <p>Ces informations seront pré-remplies automatiquement lors de vos prochains passages en caisse.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="account-profile-form">
              {profileSuccessMsg && (
                <div className="account-alert success">
                  <CheckCircle size={18} />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}
              {profileErrorMsg && (
                <div className="account-alert error">
                  <AlertCircle size={18} />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <div className="account-form-grid">
                <div className="form-group">
                  <label htmlFor="acc-firstName">Prénom *</label>
                  <input
                    id="acc-firstName"
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acc-lastName">Nom de famille *</label>
                  <input
                    id="acc-lastName"
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acc-email">Adresse e-mail (Identifiant)</label>
                  <input
                    id="acc-email"
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="disabled-input"
                  />
                  <small className="form-hint">L'adresse e-mail est liée à votre compte et ne peut être modifiée.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="acc-phone">Téléphone portable (Suivi transporteur)</label>
                  <input
                    id="acc-phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="acc-address">Adresse de livraison (Rue et numéro) *</label>
                  <input
                    id="acc-address"
                    type="text"
                    placeholder="15 Rue de Rivoli, Bâtiment B, Apt 4"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acc-postal">Code postal *</label>
                  <input
                    id="acc-postal"
                    type="text"
                    placeholder="75001"
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acc-city">Ville *</label>
                  <input
                    id="acc-city"
                    type="text"
                    placeholder="Paris"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="acc-country">Pays de destination</label>
                  <select
                    id="acc-country"
                    value={profileForm.countryCode}
                    onChange={(e) => setProfileForm({ ...profileForm, countryCode: e.target.value })}
                  >
                    <option value="FR">🇫🇷 France métropolitaine</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="CH">🇨🇭 Suisse</option>
                    <option value="LU">🇱🇺 Luxembourg</option>
                    <option value="DE">🇩🇪 Allemagne</option>
                    <option value="ES">🇪🇸 Espagne</option>
                    <option value="IT">🇮🇹 Italie</option>
                    <option value="NL">🇳🇱 Pays-Bas</option>
                    <option value="PT">🇵🇹 Portugal</option>
                    <option value="AT">🇦🇹 Autriche</option>
                  </select>
                </div>
              </div>

              <div className="account-form-actions">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="account-btn-save"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Enregistrer mes coordonnées</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: LOYALTY & REFERRAL */}
        {activeTab === 'loyalty' && (
          <div className="account-tab-content">
            <div className="account-section-header">
              <div>
                <h2>Club Privilège & Programme Parrainage</h2>
                <p>Chaque commande vous rapporte des points échangeables contre des remises immédiates.</p>
              </div>
              <button
                className="account-btn-open-loyalty"
                onClick={() => onOpenLoyalty && onOpenLoyalty()}
              >
                <Gift size={16} />
                <span>Ouvrir l'espace récompenses</span>
              </button>
            </div>

            <div className="loyalty-account-overview-grid">
              {/* Balance Card */}
              <div className="loyalty-balance-card">
                <div className="balance-header">
                  <span className="balance-subtitle">Votre solde disponible</span>
                  <div className="balance-number-row">
                    <span className="balance-big-number">{currentUser?.loyaltyPoints || 50}</span>
                    <span className="balance-unit">points</span>
                  </div>
                </div>

                <div className="balance-progress-box">
                  <div className="progress-labels">
                    <span>Objectif prochain bon : 100 pts (-10€)</span>
                    <span>{(currentUser?.loyaltyPoints || 50)} / 100</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, ((currentUser?.loyaltyPoints || 50) / 100) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="balance-tiers-list">
                  <div className="tier-row active">
                    <span className="tier-points">50 pts</span>
                    <span className="tier-benefit">Bon de remise de 5,00 €</span>
                    <span className="tier-tag unlocked">Débloqué ✓</span>
                  </div>
                  <div className="tier-row">
                    <span className="tier-points">100 pts</span>
                    <span className="tier-benefit">Bon de remise de 10,00 €</span>
                    <span className="tier-tag">À portée</span>
                  </div>
                  <div className="tier-row">
                    <span className="tier-points">200 pts</span>
                    <span className="tier-benefit">Bon VIP de 25,00 € + FDP offerts</span>
                    <span className="tier-tag">VIP</span>
                  </div>
                </div>
              </div>

              {/* Referral Share Card */}
              <div className="loyalty-referral-card">
                <div className="referral-banner-pill">
                  <Sparkles size={15} color="#ec4899" />
                  <span>PARRAINEZ VOS PROCHES</span>
                </div>
                <h3>Offrez 5,00 €, recevez 5,00 € !</h3>
                <p>
                  Partagez votre code personnel avec vos amis ou votre famille. Ils obtiennent 5 € de réduction immédiate dès 25 € d'achats, et vous recevez 50 points de fidélité à la validation de leur colis !
                </p>

                <div className="referral-code-box">
                  <div className="referral-code-label">Votre code de parrainage exclusif :</div>
                  <div className="referral-code-copy-row">
                    <span className="code-text font-mono">
                      {currentUser?.loyaltyCode || 'ESHOP-EU4821'}
                    </span>
                    <button
                      className="btn-copy-code"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? (
                        <>
                          <Check size={16} color="#059669" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copier le code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="referral-actions-row">
                  <button
                    className="btn-share-link"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? <Check size={16} color="#059669" /> : <Share2 size={16} />}
                    <span>{copiedLink ? 'Lien copié dans le presse-papier !' : 'Copier le lien direct de parrainage'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RETOURS & SAV */}
        {activeTab === 'returns' && (
          <div className="account-tab-content">
            <div className="account-section-header">
              <div>
                <h2>Mes Retours & SAV Client</h2>
                <p>
                  Gérez vos demandes de rétractation et SAV sous garantie 30 jours UE. Téléchargez vos étiquettes Colissimo prépayées et suivez l'acheminement jusqu'au remboursement.
                </p>
              </div>
            </div>

            {isLoadingReturns ? (
              <div className="account-loading-state">
                <RefreshCw size={28} className="spin-icon" />
                <p>Chargement de vos dossiers de retour...</p>
              </div>
            ) : returnsList.length === 0 ? (
              <div className="account-empty-orders">
                <div className="empty-icon-circle">
                  <RotateCcw size={36} color="#0284c7" />
                </div>
                <h3>Vous n'avez aucun retour en cours</h3>
                <p>
                  Tous vos achats sur Eshop bénéficient de la <strong>garantie 30 jours satisfait ou remboursé</strong>. Si un article ne vous convient pas, vous pouvez demander un retour prépayé directement depuis votre commande.
                </p>
                <button
                  className="account-btn-cta"
                  onClick={() => setActiveTab('orders')}
                >
                  <Package size={16} />
                  <span>Consulter mes commandes</span>
                </button>
              </div>
            ) : (
              <div className="account-returns-list">
                {returnsList.map((ret) => {
                  const retDate = ret.createdAt
                    ? new Date(ret.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Date récente';

                  const isBonus = ret.refundMode === 'store_credit_bonus';

                  // Calculate timeline step (1 to 4)
                  let currentStepIdx = 1;
                  if (ret.status === 'En attente de dépôt') currentStepIdx = 2;
                  if (ret.status === 'Colis retour en transit') currentStepIdx = 3;
                  if (ret.status === 'Réceptionné & inspecté' || ret.status === 'Remboursé') currentStepIdx = 4;

                  return (
                    <article key={ret.id} className="account-return-card">
                      <header className="return-card-header">
                        <div className="return-card-title-group">
                          <span className="return-rma-id font-mono font-bold">
                            {ret.id}
                          </span>
                          <span className="return-order-ref">
                            Commande #{ret.orderNumber}
                          </span>
                          <span className="return-date-text">
                            Initié le {retDate}
                          </span>
                        </div>

                        <div className="return-card-status-badge">
                          <span className={`rma-status-pill ${ret.status === 'Remboursé' ? 'success' : 'pending'}`}>
                            {ret.status}
                          </span>
                          <span className="return-amount-pill font-mono">
                            {ret.refundAmount} €
                          </span>
                        </div>
                      </header>

                      {/* 4-Step Progress Tracker */}
                      <div className="return-progress-tracker">
                        <div className={`return-progress-step ${currentStepIdx >= 1 ? 'completed' : ''}`}>
                          <div className="step-circle">1</div>
                          <span className="step-label">Demande créée</span>
                        </div>
                        <div className={`return-progress-line ${currentStepIdx >= 2 ? 'active' : ''}`} />
                        <div className={`return-progress-step ${currentStepIdx >= 2 ? 'completed' : ''}`}>
                          <div className="step-circle">2</div>
                          <span className="step-label">Étiquette prête</span>
                        </div>
                        <div className={`return-progress-line ${currentStepIdx >= 3 ? 'active' : ''}`} />
                        <div className={`return-progress-step ${currentStepIdx >= 3 ? 'completed' : ''}`}>
                          <div className="step-circle">3</div>
                          <span className="step-label">Colis en transit</span>
                        </div>
                        <div className={`return-progress-line ${currentStepIdx >= 4 ? 'active' : ''}`} />
                        <div className={`return-progress-step ${currentStepIdx >= 4 ? 'completed' : ''}`}>
                          <div className="step-circle">4</div>
                          <span className="step-label">Remboursement validé</span>
                        </div>
                      </div>

                      {/* Returned Items Preview */}
                      <div className="return-card-body">
                        <div className="return-items-preview">
                          <span className="section-small-title">Articles renvoyés :</span>
                          <div className="return-items-grid">
                            {(ret.items || []).map((it, idx) => (
                              <div key={idx} className="return-item-mini">
                                <img
                                  src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80'}
                                  alt={it.productName || it.name}
                                  className="mini-thumb"
                                />
                                <div className="mini-info">
                                  <span className="mini-title">{it.productName || it.name}</span>
                                  <span className="mini-meta">
                                    Qté : <strong>{it.quantity}</strong> × {Number(it.unitPrice || it.price || 0).toFixed(2)} €
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Motif & Mode */}
                        <div className="return-meta-details-box">
                          <div className="meta-detail-row">
                            <span className="meta-label">Motif déclaré :</span>
                            <span className="meta-value">{ret.reason}</span>
                          </div>
                          <div className="meta-detail-row">
                            <span className="meta-label">Mode de compensation :</span>
                            <span className="meta-value">
                              {isBonus ? (
                                <span className="compensation-badge bonus">
                                  <Gift size={13} /> Avoir boutique (+5% offert inclus)
                                </span>
                              ) : (
                                <span className="compensation-badge standard">
                                  <CreditCard size={13} /> Recrédit bancaire direct
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="meta-detail-row">
                            <span className="meta-label">N° Suivi Colissimo Retour :</span>
                            <span className="meta-value font-mono font-bold text-slate-800">
                              {ret.returnLabelBarcode || '8R9283748293FR'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <footer className="return-card-footer">
                        <button
                          className="account-btn-action primary"
                          onClick={() => setViewingReturnLabelRma(ret)}
                        >
                          <Printer size={15} />
                          <span>Voir / Imprimer l'étiquette Colissimo</span>
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="account-tab-content">
            <div className="account-section-header">
              <div>
                <h2>Sécurité de votre compte</h2>
                <p>Gérez vos identifiants et votre mot de passe d'accès.</p>
              </div>
            </div>

            <div className="account-security-layout">
              {/* Password Form */}
              <div className="security-card">
                <h3>Modifier mon mot de passe</h3>
                <form onSubmit={handleChangePassword} className="account-pw-form">
                  {pwSuccessMsg && (
                    <div className="account-alert success">
                      <CheckCircle size={18} />
                      <span>{pwSuccessMsg}</span>
                    </div>
                  )}
                  {pwErrorMsg && (
                    <div className="account-alert error">
                      <AlertCircle size={18} />
                      <span>{pwErrorMsg}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="pw-current">Mot de passe actuel *</label>
                    <div className="pw-input-wrapper">
                      <input
                        id="pw-current"
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        tabIndex={-1}
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pw-new">Nouveau mot de passe (min. 6 caractères) *</label>
                    <div className="pw-input-wrapper">
                      <input
                        id="pw-new"
                        type={showNewPw ? 'text' : 'password'}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="pw-toggle-btn"
                        onClick={() => setShowNewPw(!showNewPw)}
                        tabIndex={-1}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pw-confirm">Confirmer le nouveau mot de passe *</label>
                    <input
                      id="pw-confirm"
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPw}
                    className="account-btn-save"
                  >
                    {isChangingPw ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" />
                        <span>Mise à jour...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Changer mon mot de passe</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Session and Logout card */}
              <div className="security-card info-card">
                <h3>Session & Déconnexion</h3>
                <div className="session-status-row">
                  <div className="session-dot active" />
                  <div>
                    <strong>Session active sécurisée</strong>
                    <p className="session-desc">Connecté avec jeton chiffré 256-bit (expiration automatique sous 30 jours).</p>
                  </div>
                </div>

                <div className="security-tips-box">
                  <ShieldCheck size={18} color="#059669" />
                  <p>
                    Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs. Tous les paiements bénéficient de l'authentification 3D Secure v2.
                  </p>
                </div>

                <div className="logout-section">
                  <button
                    className="account-btn-logout"
                    onClick={onLogout}
                  >
                    <LogOut size={16} />
                    <span>Se déconnecter de cet appareil</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Official Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Customer Return & RMA Modal (Creation) */}
      {returnOrderModal && (
        <ReturnRequestModal
          order={returnOrderModal}
          currentUser={currentUser}
          onClose={() => setReturnOrderModal(null)}
          onReturnCreated={(newRma) => {
            loadUserReturns();
            setActiveTab('returns');
          }}
        />
      )}

      {/* Customer Return & RMA Modal (View/Print Existing Label) */}
      {viewingReturnLabelRma && (
        <ReturnRequestModal
          order={{ orderNumber: viewingReturnLabelRma.orderNumber, order_number: viewingReturnLabelRma.orderNumber }}
          currentUser={currentUser}
          existingReturn={viewingReturnLabelRma}
          onClose={() => setViewingReturnLabelRma(null)}
        />
      )}
    </div>
  );
}

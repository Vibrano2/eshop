import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  TrendingUp,
  Euro,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  Download,
  Eye,
  Plus,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  X,
  ChevronRight,
  Mail
} from 'lucide-react';
import {
  apiGetAdminStats,
  apiGetAdminOrders,
  apiUpdateOrderStatus,
  apiGetAdminProducts,
  apiUpdateProductStock,
  apiGetAdminSubscribers,
  apiResendOrderEmail,
  exportToCsv
} from '../services/api';

const STATUS_CONFIG = {
  'Confirmée & en préparation': { label: 'En préparation', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  'Expédiée': { label: 'Expédiée', color: '#3b82f6', bg: '#eff6ff', icon: Truck },
  'En cours de livraison': { label: 'En livraison', color: '#8b5cf6', bg: '#f5f3ff', icon: Package },
  'Livrée': { label: 'Livrée', color: '#10b981', bg: '#ecfdf5', icon: CheckCircle2 },
  'Annulée': { label: 'Annulée', color: '#ef4444', bg: '#fef2f2', icon: AlertTriangle }
};

export default function AdminDashboard({ onNavigateHome, currentUser, onOpenTrackingWithOrder }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'stocks' | 'subscribers'
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Stats state
  const [stats, setStats] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [adminEmailPreviewUrl, setAdminEmailPreviewUrl] = useState(null);

  // Products & Stock state
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [updatingStockId, setUpdatingStockId] = useState(null);

  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData, productsData, subscribersData] = await Promise.all([
        apiGetAdminStats(),
        apiGetAdminOrders(),
        apiGetAdminProducts(),
        apiGetAdminSubscribers()
      ]);

      if (statsData) setStats(statsData);
      if (ordersData) setOrders(ordersData);
      if (productsData) setProducts(productsData);
      if (subscribersData) setSubscribers(subscribersData);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update order status handler
  const handleStatusChange = async (orderNumber, newStatus) => {
    setUpdatingOrderId(orderNumber);
    try {
      const res = await apiUpdateOrderStatus(orderNumber, {
        status: newStatus,
        note: 'Mis à jour depuis le Back-office'
      });
      if (res && res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderNumber
              ? { ...o, status: newStatus, steps: res.order?.steps || o.steps }
              : o
          )
        );
        if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
          setSelectedOrder((prev) => ({
            ...prev,
            status: newStatus,
            steps: res.order?.steps || prev.steps
          }));
        }
        showToast(`Commande ${orderNumber} passée au statut "${newStatus}".`);
      } else {
        showToast('Impossible de mettre à jour le statut.');
      }
    } catch (err) {
      showToast('Erreur lors de la mise à jour.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Resend order confirmation email handler
  const handleResendEmailAdmin = async (orderNumber) => {
    setResendingEmail(true);
    try {
      const res = await apiResendOrderEmail(orderNumber);
      if (res && res.success) {
        showToast(`Email de confirmation & facture renvoyé pour #${orderNumber} !`);
        if (res.previewUrl) {
          setAdminEmailPreviewUrl(res.previewUrl);
        }
      } else {
        showToast(res?.error || 'Erreur lors du renvoi de l’email.');
      }
    } catch (err) {
      showToast('Erreur lors du renvoi de l’email.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Quick replenish stock handler (+10, +50, or custom)
  const handleReplenishStock = async (productId, delta) => {
    setUpdatingStockId(productId);
    try {
      const res = await apiUpdateProductStock(productId, { delta });
      if (res && res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: res.stock } : p))
        );
        showToast(`Stock rechargé : +${delta} unités (${res.name}).`);
      }
    } catch (err) {
      showToast('Erreur de réapprovisionnement.');
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const q = orderSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o.lastName && o.lastName.toLowerCase().includes(q)) ||
        (o.city && o.city.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock < 10;
      if (stockFilter === 'out') matchesStock = p.stock <= 0;

      const q = productSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      return matchesStock && matchesQuery;
    });
  }, [products, stockFilter, productSearch]);

  // Export orders to CSV
  const handleExportOrders = () => {
    exportToCsv(
      `commandes-eshop-${new Date().toISOString().slice(0, 10)}`,
      orders,
      [
        { label: 'N° Commande', key: 'orderNumber' },
        { label: 'Date', key: 'date' },
        { label: 'Email Client', key: 'customerEmail' },
        { label: 'Nom', key: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
        { label: 'Ville', key: 'city' },
        { label: 'Pays', key: 'countryCode' },
        { label: 'Montant Total (€)', key: 'totalAmount' },
        { label: 'Statut', key: 'status' },
        { label: 'Transporteur', key: 'carrier' }
      ]
    );
    showToast('Export CSV des commandes téléchargé !');
  };

  // Export subscribers to CSV
  const handleExportSubscribers = () => {
    exportToCsv(
      `abonnes-newsletter-${new Date().toISOString().slice(0, 10)}`,
      subscribers,
      [
        { label: 'Email', key: 'email' },
        { label: 'Code Promo Offert', key: 'promo_code' },
        { label: 'Date d’inscription', key: 'created_at' }
      ]
    );
    showToast('Export CSV des abonnés téléchargé !');
  };

  return (
    <div className="admin-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Bar */}
      <header className="admin-header-bar">
        <div className="admin-header-left">
          <button onClick={onNavigateHome} className="admin-back-btn" title="Retourner à la boutique">
            <ArrowLeft size={16} />
            <span>Boutique</span>
          </button>
          <div className="admin-title-wrap">
            <div className="admin-badge-role">ADMINISTRATEUR</div>
            <h1 className="admin-site-title">eshop-store.eu — Back-Office</h1>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-server-status">
            <span className="server-dot-online" />
            <span>Serveur SQLite Actif</span>
          </div>

          <button
            onClick={loadData}
            className="admin-action-refresh-btn"
            title="Actualiser les données"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Actualiser</span>
          </button>

          <div className="admin-user-pill">
            <div className="admin-user-avatar">
              {currentUser?.firstName ? currentUser.firstName.charAt(0) : 'A'}
            </div>
            <span className="admin-user-name">{currentUser?.firstName || 'Directeur'}</span>
          </div>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="admin-body-container">
        {/* Navigation Tabs Bar */}
        <nav className="admin-tabs-nav" aria-label="Onglets Administration">
          <button
            className={`admin-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Vue d'ensemble</span>
          </button>

          <button
            className={`admin-tab-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            <span>Commandes</span>
            <span className="admin-count-pill">{orders.length}</span>
          </button>

          <button
            className={`admin-tab-item ${activeTab === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            <Boxes size={18} />
            <span>Gestion des Stocks</span>
            <span className="admin-count-pill">{products.length}</span>
          </button>

          <button
            className={`admin-tab-item ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            <Users size={18} />
            <span>Clients & Newsletter</span>
            <span className="admin-count-pill">{subscribers.length}</span>
          </button>
        </nav>

        {/* ------------------------------------------------------------------
            TAB 1: VUE D'ENSEMBLE (KPIs & ANALYTICS)
            ------------------------------------------------------------------ */}
        {activeTab === 'overview' && (
          <div className="admin-tab-content">
            {/* 4 Metric Cards */}
            <div className="admin-kpis-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap revenue">
                  <Euro size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Chiffre d'Affaires Global</span>
                  <div className="kpi-value">{stats ? stats.totalRevenue.toFixed(2) : '0.00'} €</div>
                  <span className="kpi-subtext">Aujourd'hui : +{stats ? stats.todayRevenue.toFixed(2) : '0.00'} €</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap orders">
                  <ShoppingBag size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Commandes Passées</span>
                  <div className="kpi-value">{stats ? stats.ordersCount : 0}</div>
                  <span className="kpi-subtext">Panier moyen : {stats ? stats.averageCart.toFixed(2) : '0.00'} €</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrap customers">
                  <Users size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Comptes Clients & Inscrits</span>
                  <div className="kpi-value">{stats ? stats.customersCount : 0}</div>
                  <span className="kpi-subtext">Newsletter : {stats ? stats.subscribersCount : 0} contacts</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className={`kpi-icon-wrap stocks ${stats && stats.lowStockCount > 0 ? 'warning' : ''}`}>
                  <AlertTriangle size={22} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Alertes Rupture de Stock</span>
                  <div className="kpi-value">{stats ? stats.lowStockCount : 0}</div>
                  <span className="kpi-subtext">{stats && stats.lowStockCount > 0 ? 'Articles avec stock < 10' : 'Tous stocks approvisionnés'}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Breakdown & Recent Orders Split */}
            <div className="admin-overview-columns">
              {/* Left Column: Status Breakdown */}
              <div className="admin-card-box">
                <h3 className="admin-card-title">Répartition des Commandes</h3>
                <div className="admin-status-bars-list">
                  {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                    const count = (stats?.statusBreakdown && stats.statusBreakdown[statusKey]) || 0;
                    const total = stats?.ordersCount || 1;
                    const pct = Math.round((count / total) * 100);
                    const IconComp = cfg.icon;

                    return (
                      <div key={statusKey} className="admin-status-bar-row">
                        <div className="admin-status-bar-header">
                          <span className="admin-status-badge" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                            <IconComp size={13} />
                            <span>{statusKey}</span>
                          </span>
                          <span className="admin-status-count">{count} commandes ({pct}%)</span>
                        </div>
                        <div className="admin-progress-track">
                          <div
                            className="admin-progress-fill"
                            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 5 Latest Orders */}
              <div className="admin-card-box">
                <div className="admin-card-header-row">
                  <h3 className="admin-card-title">Dernières Commandes</h3>
                  <button onClick={() => setActiveTab('orders')} className="admin-link-action">
                    <span>Tout voir</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="admin-recent-orders-list">
                  {orders.slice(0, 5).map((o) => {
                    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG['Confirmée & en préparation'];
                    return (
                      <div
                        key={o.orderNumber}
                        className="admin-recent-order-item"
                        onClick={() => {
                          setSelectedOrder(o);
                        }}
                      >
                        <div className="recent-order-main">
                          <span className="recent-order-num">{o.orderNumber}</span>
                          <span className="recent-order-client">{o.firstName} {o.lastName}</span>
                        </div>
                        <div className="recent-order-meta">
                          <span className="recent-order-amount">{o.totalAmount.toFixed(2)} €</span>
                          <span className="admin-status-pill small" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: GESTION DES COMMANDES (ORDER MANAGER)
            ------------------------------------------------------------------ */}
        {activeTab === 'orders' && (
          <div className="admin-tab-content">
            {/* Actions & Filters Bar */}
            <div className="admin-toolbar-row">
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par N° commande, email, nom, ville..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                {orderSearch && (
                  <button onClick={() => setOrderSearch('')} className="admin-search-clear">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="admin-filter-pills-group">
                <button
                  className={`admin-filter-pill ${orderStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('all')}
                >
                  Toutes ({orders.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = orders.filter((o) => o.status === key).length;
                  return (
                    <button
                      key={key}
                      className={`admin-filter-pill ${orderStatusFilter === key ? 'active' : ''}`}
                      onClick={() => setOrderStatusFilter(key)}
                    >
                      {cfg.label} ({count})
                    </button>
                  );
                })}
              </div>

              <button onClick={handleExportOrders} className="btn btn-secondary admin-export-btn">
                <Download size={15} />
                <span>Exporter CSV</span>
              </button>
            </div>

            {/* Orders Data Table */}
            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>N° Commande</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Destination</th>
                    <th>Articles</th>
                    <th>Montant Total</th>
                    <th>Transporteur</th>
                    <th>Statut Colis</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="admin-table-empty">
                        Aucune commande ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG['Confirmée & en préparation'];
                      const isUpdating = updatingOrderId === o.orderNumber;

                      return (
                        <tr key={o.orderNumber}>
                          <td>
                            <strong className="order-number-text">{o.orderNumber}</strong>
                          </td>
                          <td className="order-date-text">
                            {new Date(o.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </td>
                          <td>
                            <div className="client-cell">
                              <span className="client-name">{o.firstName} {o.lastName}</span>
                              <span className="client-email">{o.customerEmail}</span>
                            </div>
                          </td>
                          <td>
                            <span className="country-badge">
                              {o.countryCode || 'FR'} • {o.city}
                            </span>
                          </td>
                          <td>
                            <span className="items-count-badge">
                              {o.items?.length || 1} art.
                            </span>
                          </td>
                          <td>
                            <strong className="order-price">{o.totalAmount.toFixed(2)} €</strong>
                          </td>
                          <td>
                            <span className="carrier-badge">
                              <Truck size={12} />
                              <span>{o.carrier}</span>
                            </span>
                          </td>
                          <td>
                            {/* Inline Status Dropdown */}
                            <select
                              className="admin-status-select"
                              value={o.status}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(o.orderNumber, e.target.value)}
                              style={{ color: cfg.color, borderColor: cfg.color }}
                            >
                              {Object.keys(STATUS_CONFIG).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="admin-icon-btn"
                                title="Voir les détails de la commande"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => onOpenTrackingWithOrder && onOpenTrackingWithOrder(o.orderNumber)}
                                className="admin-icon-btn tracking"
                                title="Ouvrir la vue Suivi Colis Client"
                              >
                                <ExternalLink size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: GESTION DES STOCKS DU CATALOGUE (110 SKUs)
            ------------------------------------------------------------------ */}
        {activeTab === 'stocks' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar-row">
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par nom d'article, référence SKU, catégorie..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <button onClick={() => setProductSearch('')} className="admin-search-clear">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filter-pills-group">
                <button
                  className={`admin-filter-pill ${stockFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStockFilter('all')}
                >
                  Tous ({products.length})
                </button>
                <button
                  className={`admin-filter-pill ${stockFilter === 'low' ? 'active' : ''}`}
                  onClick={() => setStockFilter('low')}
                >
                  Stock Faible &lt; 10 ({products.filter((p) => p.stock > 0 && p.stock < 10).length})
                </button>
                <button
                  className={`admin-filter-pill ${stockFilter === 'out' ? 'active' : ''}`}
                  onClick={() => setStockFilter('out')}
                >
                  Rupture ({products.filter((p) => p.stock <= 0).length})
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Catégorie</th>
                    <th>Prix Vente</th>
                    <th>Niveau de Stock</th>
                    <th>Statut</th>
                    <th>Réapprovisionnement Rapide</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.slice(0, 40).map((p) => {
                    const isLow = p.stock > 0 && p.stock < 10;
                    const isOut = p.stock <= 0;
                    const isUpdating = updatingStockId === p.id;

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="product-table-cell">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="product-table-thumb"
                              loading="lazy"
                            />
                            <div>
                              <div className="product-table-name">{p.name}</div>
                              <span className="product-table-sku">{p.sku || p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-tag">{p.category}</span>
                        </td>
                        <td>
                          <strong>{p.price.toFixed(2)} €</strong>
                        </td>
                        <td>
                          <div className="stock-level-cell">
                            <span className={`stock-number ${isOut ? 'out' : isLow ? 'low' : 'good'}`}>
                              {p.stock} unités
                            </span>
                          </div>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="stock-pill out">Rupture</span>
                          ) : isLow ? (
                            <span className="stock-pill low">Critique (&lt;10)</span>
                          ) : (
                            <span className="stock-pill good">En stock</span>
                          )}
                        </td>
                        <td>
                          <div className="replenish-buttons-row">
                            <button
                              className="replenish-btn"
                              disabled={isUpdating}
                              onClick={() => handleReplenishStock(p.id, 10)}
                            >
                              +10
                            </button>
                            <button
                              className="replenish-btn plus50"
                              disabled={isUpdating}
                              onClick={() => handleReplenishStock(p.id, 50)}
                            >
                              +50 UE
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredProducts.length > 40 && (
              <p className="admin-pagination-note">
                Affichage des 40 premiers produits sur {filteredProducts.length}. Utilisez la recherche pour cibler un article.
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 4: CLIENTS & ABONNÉS NEWSLETTER
            ------------------------------------------------------------------ */}
        {activeTab === 'subscribers' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar-row">
              <div>
                <h3 className="admin-card-title">Abonnés Newsletter & Prospects</h3>
                <p className="admin-card-subtitle">
                  Liste des adresses e-mails inscrites via le pied de page et éligibles aux campagnes promotionnelles.
                </p>
              </div>

              <button onClick={handleExportSubscribers} className="btn btn-secondary admin-export-btn">
                <Download size={15} />
                <span>Exporter les Contacts (CSV)</span>
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Adresse E-mail</th>
                    <th>Code Promotionnel Attribué</th>
                    <th>Date d'Inscription</th>
                    <th>Statut Opt-in RGPD</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="admin-table-empty">
                        Aucun abonné enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{sub.email}</strong>
                        </td>
                        <td>
                          <span className="promo-badge-tag">{sub.promo_code || 'BIENVENUE10'} (-10%)</span>
                        </td>
                        <td>{sub.created_at || 'Récent'}</td>
                        <td>
                          <span className="rgpd-badge">
                            <CheckCircle2 size={13} />
                            <span>Vérifié & Actif</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------
          ORDER DETAILS POPUP MODAL
          ------------------------------------------------------------------ */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="modal-eyebrow">Détail Commande Client</span>
                <h2 className="admin-modal-title">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="admin-modal-close"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Order Meta Bar */}
              <div className="order-details-summary-card">
                <div>
                  <span className="sum-label">Client</span>
                  <strong>{selectedOrder.firstName} {selectedOrder.lastName}</strong>
                  <span className="sum-email">{selectedOrder.customerEmail}</span>
                </div>
                <div>
                  <span className="sum-label">Adresse de livraison</span>
                  <div>{selectedOrder.shippingAddress}</div>
                  <div>{selectedOrder.postalCode} {selectedOrder.city}, {selectedOrder.countryCode}</div>
                </div>
                <div>
                  <span className="sum-label">Transporteur</span>
                  <strong>{selectedOrder.carrier}</strong>
                  <span className="sum-sub">{selectedOrder.estimatedDelivery}</span>
                </div>
                <div>
                  <span className="sum-label">Total Payé</span>
                  <strong className="sum-price">{selectedOrder.totalAmount.toFixed(2)} €</strong>
                </div>
              </div>

              {/* Status Selector in Modal */}
              <div className="modal-status-edit-row">
                <label>Changer le statut d'expédition :</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.orderNumber, e.target.value)}
                  className="admin-status-select large"
                >
                  {Object.keys(STATUS_CONFIG).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Confirmation Dispatch Card */}
              <div style={{
                marginTop: '1rem',
                marginBottom: '1.25rem',
                padding: '0.85rem 1.15rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="#2563eb" />
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Email & Facture Client</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Destinataire : {selectedOrder.customerEmail}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleResendEmailAdmin(selectedOrder.orderNumber)}
                    disabled={resendingEmail}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 size={14} className="spin-icon" />
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Renvoyer l'email de confirmation</span>
                      </>
                    )}
                  </button>
                  {adminEmailPreviewUrl && (
                    <a
                      href={adminEmailPreviewUrl}
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
                        background: '#eff6ff',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Aperçu Web Sandbox</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Items List */}
              <h4 className="modal-section-subtitle">Articles Commandés ({selectedOrder.items?.length || 0})</h4>
              <div className="modal-items-list">
                {selectedOrder.items && selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="modal-item-row">
                    <img
                      src={it.product_image || it.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                      alt={it.product_name || it.name}
                      className="modal-item-thumb"
                    />
                    <div className="modal-item-info">
                      <span className="modal-item-title">{it.product_name || it.name}</span>
                      <span className="modal-item-qty">Quantité : {it.quantity}</span>
                    </div>
                    <span className="modal-item-price">{(it.unit_price || it.price || 0).toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {/* Tracking Timeline in Modal */}
              <h4 className="modal-section-subtitle">Historique des Étapes de Suivi</h4>
              <div className="modal-tracking-steps">
                {selectedOrder.steps && selectedOrder.steps.map((step, idx) => (
                  <div key={idx} className="modal-tracking-step-row">
                    <div className="step-bullet-icon">
                      <CheckCircle2 size={16} color="#10b981" />
                    </div>
                    <div>
                      <span className="step-title-text">{step.title}</span>
                      <span className="step-date-text">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

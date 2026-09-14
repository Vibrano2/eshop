import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ShieldCheck,
  Package,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Globe,
  Gift,
  User,
  UserCheck,
  LogOut,
  LayoutDashboard,
  Star,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { MAIN_CATEGORIES } from '../data/categories';
import { TRANSLATIONS } from '../data/translations';

export default function Header({
  cartCount,
  cartTotal,
  onOpenCart,
  wishlistCount,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  onOpenTracking,
  onNavigateHome,
  onOpenReassurance,
  onOpenShop,
  activeView,
  selectedCategory,
  lang = 'fr',
  setLang,
  onOpenAbout,
  onOpenLoyalty,
  loyaltyPoints = 0,
  currentUser = null,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenAccount,
  isDarkMode = false,
  onToggleDarkMode
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState({});
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const searchContainerRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);
  const langMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const currentLangObj = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Search filter across name, category, subcategory, keywords, shortDescription
  const suggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return PRODUCTS.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const catMatch = (p.categoryLabel || p.category || '').toLowerCase().includes(q);
      const subcatMatch = (p.subcategory || '').toLowerCase().includes(q);
      const descMatch = (p.shortDescription || '').toLowerCase().includes(q);
      const keywordsMatch = p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q));
      return nameMatch || catMatch || subcatMatch || descMatch || keywordsMatch;
    }).slice(0, 6);
  }, [searchQuery]);

  // Close suggestions & lang dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setIsLangMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onOpenShop) {
      onOpenShop('all');
    }
  };

  const handleSelectSuggestion = (product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    if (onOpenShop) {
      onOpenShop(product.category);
    }
  };

  const handleMouseEnterNav = (catId) => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    const cat = MAIN_CATEGORIES.find((c) => c.id === catId);
    if (cat && (cat.megaMenuGroups || cat.subcategories)) {
      setActiveMegaMenu(catId);
    } else {
      setActiveMegaMenu(null);
    }
  };

  const handleMouseLeaveNav = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

  const toggleMobileCategory = (catId) => {
    setExpandedMobileCats((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const modeCategory = MAIN_CATEGORIES.find((c) => c.id === 'mode');

  // Search trends and popular picks
  const SEARCH_TRENDS = [
    'Airfryer',
    'Aspirateur sans fil',
    'Oreiller ergonomique',
    'Ampoule connectée',
    'Bandeau spa',
    'Batterie externe'
  ];

  const popularPicks = useMemo(() => {
    return PRODUCTS.filter((p) => p.isBestSeller).slice(0, 3);
  }, []);

  return (
    <header className="site-header-modern">
      {/* Primary Header Row */}
      <div className="container">
        <div className="header-primary-row">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-trigger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu principal"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Brand Logo */}
          <button
            onClick={onNavigateHome}
            className="brand-logo-modern"
            title="Retour à l'accueil"
          >
            <img
              src="/logo.svg"
              alt="EshopStore Logo"
              className="brand-logo-img"
            />
            <span className="brand-text">
              Eshop<span className="brand-suffix">Store</span>
            </span>
          </button>

          {/* Desktop Search Bar with Live Suggestions */}
          <div className="header-search-wrap" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="search-form-modern">
              <Search size={18} className="search-icon-modern" />
              <input
                type="text"
                className="search-input-modern"
                placeholder="Rechercher un produit, mode, tech, maison, animaux..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                aria-label="Rechercher des produits"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="search-suggestions-dropdown">
                {/* Zero-state: Trends & Popular Picks */}
                {(!searchQuery || searchQuery.trim().length < 2) && (
                  <div className="search-suggestions-zero-state">
                    <div className="suggestions-section-header">
                      <TrendingUp size={14} className="trend-header-icon" />
                      <span>Recherches tendances</span>
                    </div>
                    <div className="search-trends-chips">
                      {SEARCH_TRENDS.map((trend) => (
                        <button
                          key={trend}
                          type="button"
                          className="search-trend-chip"
                          onClick={() => {
                            setSearchQuery(trend);
                            setShowSuggestions(false);
                            if (onOpenShop) onOpenShop('all');
                          }}
                        >
                          <Search size={12} />
                          <span>{trend}</span>
                        </button>
                      ))}
                    </div>

                    <div className="suggestions-section-header" style={{ marginTop: '0.75rem' }}>
                      <Sparkles size={14} color="#f59e0b" />
                      <span>Coups de cœur du moment</span>
                    </div>
                    <div className="search-popular-picks">
                      {popularPicks.map((pick) => (
                        <div
                          key={pick.id}
                          className="suggestion-item suggestion-item-rich"
                          onClick={() => handleSelectSuggestion(pick)}
                        >
                          <img
                            src={pick.image}
                            alt={pick.altText || pick.name}
                            className="suggestion-thumb"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="suggestion-details">
                            <span className="suggestion-title">{pick.name}</span>
                            <div className="suggestion-meta-row">
                              <span className="suggestion-category">{pick.categoryLabel}</span>
                              <span className="suggestion-rating">
                                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                                <span>{pick.rating}</span>
                              </span>
                            </div>
                          </div>
                          <span className="suggestion-price">{pick.price.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Query with Results */}
                {searchQuery && searchQuery.trim().length >= 2 && suggestions.length > 0 && (
                  <>
                    <div className="suggestions-header">
                      <span>Produits suggérés</span>
                      <span className="suggestions-count-badge">{suggestions.length} trouvé{suggestions.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="suggestions-list">
                      {suggestions.map((item) => (
                        <div
                          key={item.id}
                          className="suggestion-item suggestion-item-rich"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <img
                            src={item.image}
                            alt={item.altText || item.name}
                            className="suggestion-thumb"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="suggestion-details">
                            <span className="suggestion-title">{item.name}</span>
                            <div className="suggestion-meta-row">
                              <span className="suggestion-category">
                                {item.categoryLabel}
                                {item.subcategory ? ` • ${item.subcategory}` : ''}
                              </span>
                              <span className="suggestion-stock-tag">✓ En stock UE</span>
                              <span className="suggestion-rating">
                                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                                <span>{item.rating}</span>
                              </span>
                            </div>
                          </div>
                          <div className="suggestion-price-col">
                            <span className="suggestion-price">{item.price.toFixed(2)} €</span>
                            {item.compareAtPrice && (
                              <span className="suggestion-old-price">{item.compareAtPrice.toFixed(2)} €</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="suggestion-see-all"
                      onClick={handleSearchSubmit}
                    >
                      Voir tous les résultats pour « {searchQuery} » ➔
                    </button>
                  </>
                )}

                {/* Query with No Results */}
                {searchQuery && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
                  <div className="suggestions-no-results">
                    <p className="no-results-text">Aucun produit direct pour « <strong>{searchQuery}</strong> »</p>
                    <div className="suggestions-section-header" style={{ marginTop: '0.5rem' }}>
                      <TrendingUp size={13} />
                      <span>Essayez plutôt :</span>
                    </div>
                    <div className="search-trends-chips">
                      {SEARCH_TRENDS.slice(0, 4).map((trend) => (
                        <button
                          key={trend}
                          type="button"
                          className="search-trend-chip"
                          onClick={() => {
                            setSearchQuery(trend);
                            setShowSuggestions(false);
                            if (onOpenShop) onOpenShop('all');
                          }}
                        >
                          {trend}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Action Items */}
          <div className="header-actions-group">
            {/* Language Selector Dropdown - Desktop only */}
            <div className="header-lang-wrapper header-desktop-control" ref={langMenuRef}>
              <button
                className="action-pill-lang"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                title="Changer de langue / Change language / Sprache ändern"
                aria-expanded={isLangMenuOpen}
              >
                <Globe size={15} />
                <span className="pill-flag">{currentLangObj.flag}</span>
                <span className="pill-lang-code">{currentLangObj.code.toUpperCase()}</span>
                <ChevronDown size={12} className={`lang-chevron ${isLangMenuOpen ? 'open' : ''}`} />
              </button>
              {isLangMenuOpen && (
                <div className="header-lang-dropdown">
                  {Object.values(TRANSLATIONS).map((l) => (
                    <button
                      key={l.code}
                      className={`lang-option-btn ${lang === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLang?.(l.code);
                        setIsLangMenuOpen(false);
                      }}
                    >
                      <span className="lang-flag">{l.flag}</span>
                      <span className="lang-name">{l.label}</span>
                      {lang === l.code && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark / Light Mode Switcher - Desktop only */}
            <button
              type="button"
              className={`action-pill-theme header-desktop-control ${isDarkMode ? 'dark-active' : 'light-active'}`}
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <div className="theme-toggle-track">
                <div className="theme-toggle-thumb">
                  {isDarkMode ? <Sun size={13} className="theme-sun-icon" /> : <Moon size={13} className="theme-moon-icon" />}
                </div>
              </div>
              <span className="pill-theme-label">{isDarkMode ? 'Clair' : 'Sombre'}</span>
            </button>

            {/* EU Guarantees badge - Desktop only */}
            <button
              className="action-pill-guarantee header-desktop-control"
              onClick={onOpenReassurance}
              title="Garanties & Engagements UE"
            >
              <ShieldCheck size={16} color="#10b981" />
              <span className="pill-text">{t.nav.guarantees || 'Garanties UE'}</span>
            </button>

            {/* Loyalty & Referral Button - Desktop only */}
            <button
              className="action-pill-loyalty header-desktop-control"
              onClick={onOpenLoyalty}
              title={t.loyalty?.headerBtn || 'Fidélité & Parrainage'}
            >
              <Gift size={15} color="#ec4899" />
              {currentUser ? (
                <>
                  <span className="pill-points-val">{currentUser.loyaltyPoints ?? 0}</span>
                  <span className="pill-points-unit">{t.loyalty?.pointsSuffix || 'pts'}</span>
                </>
              ) : (
                <span className="pill-points-val">{t.loyalty?.title || 'Fidélité'}</span>
              )}
            </button>

            {/* User Account / Login Action */}
            {currentUser ? (
              <div className="header-user-wrapper" ref={userMenuRef}>
                {/* Desktop pill */}
                <button
                  className="action-pill-user header-desktop-control"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  title={`Mon compte (${currentUser.firstName || 'Client'})`}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="user-avatar-badge">
                    {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="user-name-text">{currentUser.firstName}</span>
                  <ChevronDown size={12} className={`lang-chevron ${isUserMenuOpen ? 'open' : ''}`} />
                </button>

                {/* Mobile compact avatar button only (icon only, no name) */}
                <button
                  className="header-user-mobile-btn"
                  onClick={() => (onOpenAccount ? onOpenAccount() : setIsMobileMenuOpen(true))}
                  title={`Mon compte (${currentUser.firstName || 'Client'})`}
                  aria-label="Mon compte"
                >
                  <div className="user-avatar-badge mobile-avatar">
                    {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="header-user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{currentUser.firstName} {currentUser.lastName}</div>
                      <div className="user-dropdown-email">{currentUser.email}</div>
                      <div className="user-dropdown-loyalty">
                        <Gift size={13} color="#ec4899" />
                        <span>{currentUser.loyaltyPoints ?? 0} points fidélité</span>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item font-medium"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenAccount) onOpenAccount();
                      }}
                    >
                      <User size={16} color="#2563eb" />
                      <span>Mon Compte Client</span>
                    </button>
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenAccount) onOpenAccount('orders');
                        else if (onOpenTracking) onOpenTracking();
                      }}
                    >
                      <Package size={16} />
                      <span>Mes Commandes & Colis</span>
                    </button>
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenLoyalty) onOpenLoyalty();
                      }}
                    >
                      <Gift size={16} color="#ec4899" />
                      <span>Mon Club Fidélité & Parrainage</span>
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        className="user-dropdown-item admin-link"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenAdmin) onOpenAdmin();
                        }}
                      >
                        <LayoutDashboard size={16} color="#7c3aed" />
                        <span className="admin-text-highlight">Tableau de Bord Admin</span>
                      </button>
                    )}
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item logout"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="header-icon-action header-desktop-control"
                onClick={() => onOpenAuth && onOpenAuth('login')}
                title="Se connecter / Mon compte"
                aria-label="Se connecter"
              >
                <User size={20} />
                <span className="action-text">Connexion</span>
              </button>
            )}

            {/* Order Tracking - Desktop only */}
            <button
              className="header-icon-action header-desktop-control"
              onClick={onOpenTracking}
              title="Suivre ma commande"
              aria-label="Suivre ma commande"
            >
              <Package size={20} />
              <span className="action-text">Suivi Colis</span>
            </button>

            {/* Wishlist - Desktop only */}
            <button
              className="header-icon-action header-desktop-control"
              onClick={() => (onOpenShop ? onOpenShop('all') : null)}
              title={`Favoris (${wishlistCount})`}
              aria-label={`Favoris (${wishlistCount})`}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="header-badge-count">{wishlistCount}</span>
              )}
            </button>

            {/* Cart Button - Mobile & Desktop */}
            <button
              className="header-cart-action"
              onClick={onOpenCart}
              title="Voir mon panier"
              aria-label={`Panier avec ${cartCount} articles, montant total ${cartTotal.toFixed(2)} €`}
            >
              <div className="cart-icon-wrapper">
                <ShoppingBag size={18} />
                <span className="cart-badge-count">{cartCount}</span>
              </div>
              <div className="cart-total-info">
                <span className="cart-label">Panier</span>
                <span className="cart-amount">
                  {cartTotal > 0 ? `${cartTotal.toFixed(2)} €` : '0,00 €'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar (Desktop) with 10 Main Categories & Mega-Menu */}
      <nav
        className="header-secondary-nav"
        aria-label="Navigation principale"
        onMouseLeave={handleMouseLeaveNav}
      >
        <div className="container">
          <ul className="secondary-nav-list">
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'home' ? 'active' : ''}`}
                onClick={onNavigateHome}
              >
                Accueil
              </button>
            </li>

            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => onOpenShop('all')}
              >
                Boutique
              </button>
            </li>

            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && (selectedCategory === 'tech' || selectedCategory === 'technologie') ? 'active' : ''}`}
                onClick={() => onOpenShop('tech')}
              >
                Tech
              </button>
            </li>

            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'maison' ? 'active' : ''}`}
                onClick={() => onOpenShop('maison')}
              >
                Maison
              </button>
            </li>

            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'beaute' ? 'active' : ''}`}
                onClick={() => onOpenShop('beaute')}
              >
                Beauté
              </button>
            </li>

            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && (selectedCategory === 'voyage-auto' || selectedCategory === 'voyage' || selectedCategory === 'auto') ? 'active' : ''}`}
                onClick={() => onOpenShop('voyage-auto')}
              >
                Voyage & Auto
              </button>
            </li>

            {/* Contact */}
            <li>
              <button
                className="secondary-nav-link"
                onClick={onOpenAbout}
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Drawer with Expandable Categories */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">Menu & Rayons</span>
              <button
                className="close-drawer-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-nav-body">
              {/* Mobile Search */}
              <div className="mobile-search-section">
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              {/* Customer Section */}
              <div className="mobile-nav-section-title">Espace Client</div>
              <div className="mobile-user-section">
                {currentUser ? (
                  <div className="mobile-user-card">
                    <div className="mobile-user-header">
                      <div className="user-avatar-badge large">
                        {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="mobile-user-info">
                        <div className="mobile-user-name">{currentUser.firstName} {currentUser.lastName}</div>
                        <div className="mobile-user-email">{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="mobile-user-points">
                      <Gift size={14} color="#ec4899" />
                      <span>{currentUser.loyaltyPoints ?? 0} points fidélité</span>
                    </div>
                    <div className="mobile-user-actions">
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenAccount) onOpenAccount();
                        }}
                      >
                        <User size={15} color="#2563eb" />
                        <span>Mon compte</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenAccount) onOpenAccount('orders');
                          else if (onOpenTracking) onOpenTracking();
                        }}
                      >
                        <Package size={15} />
                        <span>Mes commandes</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenLoyalty) onOpenLoyalty();
                        }}
                      >
                        <Gift size={15} color="#ec4899" />
                        <span>Fidélité</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenTracking) onOpenTracking();
                        }}
                      >
                        <Package size={15} />
                        <span>Suivi colis</span>
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          className="mobile-user-btn admin"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (onOpenAdmin) onOpenAdmin();
                          }}
                        >
                          <LayoutDashboard size={15} color="#7c3aed" />
                          <span>Admin</span>
                        </button>
                      )}
                      <button
                        className="mobile-user-btn logout"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                      >
                        <LogOut size={15} />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mobile-guest-card">
                    <button
                      className="mobile-auth-btn"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onOpenAuth) onOpenAuth('login');
                      }}
                    >
                      <User size={18} />
                      <span>Se connecter / Créer un compte</span>
                      <span className="mobile-auth-badge">+50 pts</span>
                    </button>
                    <div className="mobile-user-actions" style={{ marginTop: '0.65rem' }}>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenAuth) onOpenAuth('login');
                        }}
                      >
                        <User size={15} color="#2563eb" />
                        <span>Mon compte</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenTracking) onOpenTracking();
                        }}
                      >
                        <Package size={15} />
                        <span>Mes commandes</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenLoyalty) onOpenLoyalty();
                        }}
                      >
                        <Gift size={15} color="#ec4899" />
                        <span>Fidélité</span>
                      </button>
                      <button
                        className="mobile-user-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (onOpenTracking) onOpenTracking();
                        }}
                      >
                        <Package size={15} />
                        <span>Suivi colis</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation links */}
              <div className="mobile-nav-section-title">Navigation</div>
              <ul className="mobile-nav-links">
                <li>
                  <button
                    onClick={() => {
                      onNavigateHome();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Accueil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('all');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Boutique
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('tech');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Tech
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('maison');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Maison
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('beaute');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Beauté
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('voyage-auto');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Voyage & Auto
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenAbout?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Contact
                  </button>
                </li>
              </ul>

              {/* Mobile Language Switcher */}
              <div className="mobile-nav-section-title">Langue / Language</div>
              <div className="mobile-lang-row">
                {Object.values(TRANSLATIONS).map((l) => (
                  <button
                    key={l.code}
                    className={`mobile-lang-pill ${lang === l.code ? 'active' : ''}`}
                    onClick={() => {
                      setLang?.(l.code);
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Theme Switcher (Dark / Light) */}
              <div className="mobile-nav-section-title">Apparence & Thème</div>
              <div className="mobile-theme-row">
                <button
                  type="button"
                  className={`mobile-theme-pill ${!isDarkMode ? 'active' : ''}`}
                  onClick={() => isDarkMode && onToggleDarkMode && onToggleDarkMode()}
                >
                  <Sun size={15} color="#eab308" />
                  <span>Mode Clair</span>
                </button>
                <button
                  type="button"
                  className={`mobile-theme-pill ${isDarkMode ? 'active' : ''}`}
                  onClick={() => !isDarkMode && onToggleDarkMode && onToggleDarkMode()}
                >
                  <Moon size={15} color="#818cf8" />
                  <span>Mode Sombre</span>
                </button>
              </div>

              {/* 10 Main Categories with Expandable Subcategories */}
              <div className="mobile-nav-section-title">Rayons de la boutique</div>
              <ul className="mobile-nav-categories-list">
                {MAIN_CATEGORIES.map((cat) => {
                  const isExpanded = !!expandedMobileCats[cat.id];
                  const hasSubcats = cat.subcategories && cat.subcategories.length > 0;

                  return (
                    <li key={cat.id} className="mobile-cat-item">
                      <div className="mobile-cat-row">
                        <button
                          className="mobile-cat-main-link"
                          onClick={() => {
                            onOpenShop(cat.id);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <span>{cat.name}</span>
                          <span className="mobile-cat-badge">{cat.itemCount}</span>
                        </button>

                        {hasSubcats && (
                          <button
                            className={`mobile-cat-expand-btn ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleMobileCategory(cat.id)}
                            aria-label={`Développer ${cat.name}`}
                          >
                            <ChevronDown size={18} />
                          </button>
                        )}
                      </div>

                      {/* Subcategories Accordion */}
                      {hasSubcats && isExpanded && (
                        <ul className="mobile-subcategories-list">
                          {cat.subcategories.map((sub) => (
                            <li key={sub.id}>
                              <button
                                className="mobile-sublink-btn"
                                onClick={() => {
                                  onOpenShop(cat.id, sub.id);
                                  setIsMobileMenuOpen(false);
                                }}
                              >
                                <ChevronRight size={14} />
                                <span>{sub.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Assistance & Guarantees */}
              <div className="mobile-nav-section-title">Assistance & Garanties</div>
              <ul className="mobile-nav-links">
                <li>
                  <button
                    onClick={() => {
                      onOpenTracking();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Package size={16} style={{ marginRight: 8 }} />
                    Suivre mon colis
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenReassurance();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <ShieldCheck size={16} style={{ marginRight: 8, color: '#10b981' }} />
                    Garanties européennes (2 ans)
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

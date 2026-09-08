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
  Gift
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
  loyaltyPoints = 50
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState({});
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const searchContainerRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);
  const langMenuRef = useRef(null);

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
            <span className="brand-flag-icon">★</span>
            <span className="brand-text">
              eshop<span className="brand-suffix">-store.eu</span>
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
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                <div className="suggestions-header">Produits suggérés</div>
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="suggestion-item"
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
                      <span className="suggestion-category">
                        {item.categoryLabel}
                        {item.subcategory ? ` • ${item.subcategory}` : ''}
                      </span>
                    </div>
                    <span className="suggestion-price">{item.price.toFixed(2)} €</span>
                  </div>
                ))}
                <button
                  className="suggestion-see-all"
                  onClick={handleSearchSubmit}
                >
                  Voir tous les résultats pour "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* Header Action Items */}
          <div className="header-actions-group">
            {/* Language Selector Dropdown */}
            <div className="header-lang-wrapper" ref={langMenuRef}>
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

            {/* EU Guarantees badge */}
            <button
              className="action-pill-guarantee"
              onClick={onOpenReassurance}
              title="Garanties & Engagements UE"
            >
              <ShieldCheck size={16} color="#10b981" />
              <span className="pill-text">{t.nav.guarantees || 'Garanties UE'}</span>
            </button>

            {/* Loyalty & Referral Button */}
            <button
              className="action-pill-loyalty"
              onClick={onOpenLoyalty}
              title={t.loyalty?.headerBtn || 'Fidélité & Parrainage'}
            >
              <Gift size={15} color="#ec4899" />
              <span className="pill-points-val">{loyaltyPoints}</span>
              <span className="pill-points-unit">{t.loyalty?.pointsSuffix || 'pts'}</span>
            </button>

            {/* Order Tracking */}
            <button
              className="header-icon-action"
              onClick={onOpenTracking}
              title="Suivre ma commande"
              aria-label="Suivre ma commande"
            >
              <Package size={20} />
              <span className="action-text">Suivi Colis</span>
            </button>

            {/* Wishlist */}
            <button
              className="header-icon-action"
              onClick={() => (onOpenShop ? onOpenShop('all') : null)}
              title={`Favoris (${wishlistCount})`}
              aria-label={`Favoris (${wishlistCount})`}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="header-badge-count">{wishlistCount}</span>
              )}
            </button>

            {/* Cart Button */}
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

            {/* 1. Mode with Mega-Menu */}
            <li
              className="nav-item-with-megamenu"
              onMouseEnter={() => handleMouseEnterNav('mode')}
            >
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'mode' ? 'active' : ''}`}
                onClick={() => onOpenShop('mode')}
              >
                <span>Mode</span>
                <ChevronDown size={13} className="nav-chevron" />
              </button>

              {/* Mode Mega-Menu Dropdown */}
              {activeMegaMenu === 'mode' && modeCategory && (
                <div
                  className="desktop-megamenu-panel"
                  onMouseEnter={() => {
                    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <div className="megamenu-content-wrap">
                    <div className="megamenu-grid">
                      {modeCategory.megaMenuGroups.map((group, idx) => (
                        <div key={idx} className="megamenu-col">
                          <h4
                            className="megamenu-col-title"
                            onClick={() => {
                              setActiveMegaMenu(null);
                              onOpenShop('mode', group.subcategoryId);
                            }}
                          >
                            {group.title}
                          </h4>
                          <ul className="megamenu-items-list">
                            {group.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <button
                                  className="megamenu-sublink"
                                  onClick={() => {
                                    setActiveMegaMenu(null);
                                    setSearchQuery(item);
                                    onOpenShop('mode', group.subcategoryId);
                                  }}
                                >
                                  {item}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="megamenu-footer-banner">
                      <div className="megamenu-banner-info">
                        <span className="badge-pill-accent">Mode tendance</span>
                        <p>Livraison rapide 2-4 jours depuis nos entrepôts de l'UE</p>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setActiveMegaMenu(null);
                          onOpenShop('mode');
                        }}
                      >
                        Voir toute la collection Mode →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* 2. Beauté */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'beaute' ? 'active' : ''}`}
                onClick={() => onOpenShop('beaute')}
              >
                Beauté
              </button>
            </li>

            {/* 3. Technologie */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'technologie' ? 'active' : ''}`}
                onClick={() => onOpenShop('technologie')}
              >
                Technologie
              </button>
            </li>

            {/* 4. Maison */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'maison' ? 'active' : ''}`}
                onClick={() => onOpenShop('maison')}
              >
                Maison
              </button>
            </li>

            {/* 5. Animaux */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'animaux' ? 'active' : ''}`}
                onClick={() => onOpenShop('animaux')}
              >
                Animaux
              </button>
            </li>

            {/* 6. Sport */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'sport' ? 'active' : ''}`}
                onClick={() => onOpenShop('sport')}
              >
                Sport
              </button>
            </li>

            {/* 7. Auto */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'auto' ? 'active' : ''}`}
                onClick={() => onOpenShop('auto')}
              >
                Auto
              </button>
            </li>

            {/* 8. Sécurité */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'securite' ? 'active' : ''}`}
                onClick={() => onOpenShop('securite')}
              >
                Sécurité
              </button>
            </li>

            {/* 9. Voyage */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'voyage' ? 'active' : ''}`}
                onClick={() => onOpenShop('voyage')}
              >
                Voyage
              </button>
            </li>

            {/* 10. Accessoires */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'accessoires' ? 'active' : ''}`}
                onClick={() => onOpenShop('accessoires')}
              >
                Accessoires
              </button>
            </li>

            <li className="nav-separator" />

            {/* Toutes les catégories */}
            <li>
              <button
                className={`secondary-nav-link ${activeView === 'shop' && selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => onOpenShop('all')}
              >
                {t.nav.allCategories || 'Toutes les catégories'}
              </button>
            </li>

            <li className="nav-separator" />

            {/* À propos */}
            <li>
              <button
                className="secondary-nav-link"
                onClick={onOpenAbout}
              >
                {t.nav.about || 'À propos'}
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

              {/* Quick links */}
              <div className="mobile-nav-section-title">{t.nav.menu || 'Navigation'}</div>
              <ul className="mobile-nav-links">
                <li>
                  <button
                    onClick={() => {
                      onNavigateHome();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t.nav.home || 'Accueil'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenShop('all');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t.nav.allCategories || 'Toutes les catégories'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenAbout?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t.nav.about || 'À propos'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onOpenLoyalty?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Gift size={15} style={{ marginRight: 6, color: '#ec4899' }} />
                    {t.loyalty?.headerBtn || 'Fidélité & Parrainage'} ({loyaltyPoints} pts)
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

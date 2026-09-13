import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import TrustBar from './components/TrustBar';
import CategoryCard from './components/CategoryCard';
import SectionHeader from './components/SectionHeader';
import ProductCard from './components/ProductCard';
import PromoBanner from './components/PromoBanner';
import WhyChooseUs from './components/WhyChooseUs';
import ReviewsSection from './components/ReviewsSection';
import NewsletterSection from './components/NewsletterSection';
import Footer from './components/Footer';

// Code-split Dedicated Views & Heavy Modals
const CataloguePage = lazy(() => import('./components/CataloguePage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const LegalPagesModal = lazy(() => import('./components/LegalPagesModal'));
const ReassuranceModal = lazy(() => import('./components/ReassuranceModal'));
const AboutModal = lazy(() => import('./components/AboutModal'));
const LoyaltyModal = lazy(() => import('./components/LoyaltyModal'));
const ProductCompareModal = lazy(() => import('./components/ProductCompareModal'));
const AbandonedCartModal = lazy(() => import('./components/AbandonedCartModal'));

// Eager Modals & Core Widgets
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ChatWidget from './components/ChatWidget';
import AuthModal from './components/AuthModal';
import CompareFloatingBar from './components/CompareFloatingBar';
import LivePurchaseToasts from './components/LivePurchaseToasts';
import CookieBanner from './components/CookieBanner';

// Services & API
import { apiGetMe, apiLogout, apiVerifyCheckoutSession } from './services/api';
import { onFirebaseAuthStateChange, firebaseSignOutUser } from './services/firebase';

// Data
import { PRODUCTS } from './data/products';
import { MAIN_CATEGORIES } from './data/categories';
import { ShieldCheck } from 'lucide-react';
import { validatePromoCode } from './data/promoCodes';
import { INITIAL_LOYALTY_STATE, calculatePointsForAmount } from './data/loyalty';

const VALID_CATEGORY_SLUGS = [
  'tech',
  'technologie',
  'maison',
  'beaute',
  'voyage-auto',
  'voyage',
  'auto',
  'mode',
  'animaux',
  'sport',
  'securite',
  'accessoires'
];

export default function App() {
  // Navigation / View state initialized from URL pathname if present
  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!path || path === 'home') {
      return 'home';
    }
    if (path === 'admin') {
      return 'admin';
    }
    if (path === 'account' || path === 'mon-compte') {
      return 'account';
    }
    if (VALID_CATEGORY_SLUGS.includes(path) || path === 'shop') {
      return 'shop';
    }
    return '404';
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (VALID_CATEGORY_SLUGS.includes(path)) {
      return path;
    }
    return 'all';
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Global Theme: Dark / Light Mode with localStorage & system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('eshop_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-theme', isDarkMode);
    localStorage.setItem('eshop_theme', theme);
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Synchronize browser history / URL with view state
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (path === 'admin') {
        setActiveView('admin');
      } else if (path === 'account' || path === 'mon-compte') {
        setActiveView('account');
      } else if (VALID_CATEGORY_SLUGS.includes(path)) {
        setActiveView('shop');
        setSelectedCategory(path);
        setSelectedSubcategory(null);
      } else if (path === 'shop') {
        setActiveView('shop');
        setSelectedCategory('all');
        setSelectedSubcategory(null);
      } else if (path === '' || path === 'home') {
        setActiveView('home');
        setSelectedCategory('all');
        setSelectedSubcategory(null);
      } else {
        setActiveView('404');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle return redirect from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const sessionId = params.get('session_id');
    const orderNumber = params.get('order_number') || localStorage.getItem('eshop_pending_order');

    if (paymentStatus === 'success' && sessionId) {
      apiVerifyCheckoutSession(sessionId).then((res) => {
        if (res && res.success && res.paid) {
          // Empty cart upon successful Stripe payment
          setCartItems([]);
          localStorage.removeItem('eshop_cart');
          localStorage.removeItem('eshop_pending_order');
          
          // Open tracking modal with confirmed order
          const confirmedOrder = res.order?.order_number || orderNumber;
          if (confirmedOrder) {
            setTrackingOrderNumber(confirmedOrder);
            setIsTrackingOpen(true);
          }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch((err) => {
        console.warn('Verify session error:', err);
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('eshop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state persisted in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('eshop_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isReassuranceOpen, setIsReassuranceOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [legalTab, setLegalTab] = useState('cgv');
  const [accountInitialTab, setAccountInitialTab] = useState('orders');

  // Product Comparison State (Max 4 items, persisted)
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem('eshop_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareToastMsg, setCompareToastMsg] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('eshop_compare', JSON.stringify(compareList));
    } catch (e) {
      console.warn('Failed to save compareList', e);
    }
  }, [compareList]);

  const showCompareToast = (msg) => {
    setCompareToastMsg(msg);
    setTimeout(() => {
      setCompareToastMsg((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleToggleCompare = (productId) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        const prod = PRODUCTS.find((p) => p.id === productId);
        showCompareToast(`« ${prod?.name || 'Produit'} » retiré du comparateur`);
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showCompareToast('Limite atteinte : vous pouvez comparer jusqu\'à 4 produits simultanément.');
        return prev;
      }
      const prod = PRODUCTS.find((p) => p.id === productId);
      showCompareToast(`« ${prod?.name || 'Produit'} » ajouté au comparateur (${prev.length + 1}/4)`);
      return [...prev, productId];
    });
  };

  const handleRemoveCompareItem = (productId) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearCompare = () => {
    setCompareList([]);
    showCompareToast('Le comparateur a été vidé');
  };

  // Abandoned Cart Recovery (Exit-Intent)
  const [isAbandonedCartOpen, setIsAbandonedCartOpen] = useState(false);

  useEffect(() => {
    let hasTriggered = false;
    try {
      hasTriggered = sessionStorage.getItem('eshop_exit_intent_dismissed') === 'true';
    } catch {
      hasTriggered = false;
    }

    const handleMouseLeave = (e) => {
      // Trigger when cursor leaves through the top boundary of the window
      if (
        e.clientY <= 12 &&
        !hasTriggered &&
        cartItems.length > 0 &&
        !isCheckoutOpen &&
        !isAbandonedCartOpen
      ) {
        hasTriggered = true;
        try {
          sessionStorage.setItem('eshop_exit_intent_dismissed', 'true');
        } catch (err) {
          console.warn('Could not save exit intent state', err);
        }
        setIsAbandonedCartOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [cartItems.length, isCheckoutOpen, isAbandonedCartOpen]);

  const handleApplyDiscountAndCheckout = (code = 'REVIENS10') => {
    handleApplyPromo(code);
    setIsAbandonedCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleApplyDiscountAndStay = (code = 'REVIENS10') => {
    handleApplyPromo(code);
    setIsAbandonedCartOpen(false);
    showCompareToast('Remise de -10% appliquée à votre panier !');
  };

  // Authenticated User State persisted across page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('eshop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage synchronized whenever currentUser changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('eshop_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('eshop_user');
      }
    } catch (err) {
      console.warn('Failed to sync user storage:', err);
    }
  }, [currentUser]);

  // Restore & verify authenticated session on app load (Firebase + Local)
  useEffect(() => {
    let isMounted = true;

    // 1. Listen to Firebase Auth (Email, Google, Apple)
    const unsubscribeFirebase = onFirebaseAuthStateChange((fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        setCurrentUser(fbUser);
        try {
          localStorage.setItem('eshop_user', JSON.stringify(fbUser));
        } catch {}
        if (fbUser.loyaltyPoints !== undefined) {
          setLoyaltyState((prev) => ({
            ...prev,
            points: fbUser.loyaltyPoints,
            referralCode: fbUser.loyaltyCode || prev.referralCode
          }));
        }
      }
    });

    // 2. Also verify and refresh session from server if token exists
    apiGetMe()
      .then((user) => {
        if (isMounted && user) {
          setCurrentUser(user);
          try {
            localStorage.setItem('eshop_user', JSON.stringify(user));
          } catch {}
          if (user.loyaltyPoints !== undefined) {
            setLoyaltyState((prev) => ({
              ...prev,
              points: user.loyaltyPoints,
              referralCode: user.loyaltyCode || prev.referralCode
            }));
          }
        }
      })
      .catch((err) => console.warn('Could not restore session:', err));

    return () => {
      isMounted = false;
      if (typeof unsubscribeFirebase === 'function') {
        unsubscribeFirebase();
      }
    };
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('eshop_user', JSON.stringify(user));
    } catch {}
    if (user.loyaltyPoints !== undefined) {
      setLoyaltyState((prev) => ({
        ...prev,
        points: user.loyaltyPoints,
        referralCode: user.loyaltyCode || prev.referralCode
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOutUser();
    } catch (e) {
      // non-blocking
    }
    await apiLogout();
    setCurrentUser(null);
    try {
      localStorage.removeItem('eshop_user');
    } catch {}
  };

  // Loyalty & Referral Program State persisted in localStorage
  const [loyaltyState, setLoyaltyState] = useState(() => {
    try {
      const saved = localStorage.getItem('eshop_loyalty');
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_STATE;
    } catch {
      return INITIAL_LOYALTY_STATE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eshop_loyalty', JSON.stringify(loyaltyState));
    } catch (err) {
      console.error(err);
    }
  }, [loyaltyState]);

  const handleClaimReward = (reward) => {
    if (loyaltyState.points < reward.pointsRequired) return;
    setLoyaltyState((prev) => ({
      ...prev,
      points: prev.points - reward.pointsRequired,
      claimedCoupons: [...(prev.claimedCoupons || []), reward.code],
      history: [
        {
          id: `claim-${Date.now()}`,
          date: new Date().toLocaleDateString('fr-FR'),
          label: `Échange : ${reward.title[currentLang] || reward.title.fr}`,
          points: reward.pointsRequired,
          type: 'debit'
        },
        ...prev.history
      ]
    }));
    handleApplyPromo(reward.code);
  };

  // Language state persisted in localStorage
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem('eshop_lang') || 'fr';
    } catch {
      return 'fr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eshop_lang', currentLang);
    } catch (err) {
      console.error(err);
    }
  }, [currentLang]);

  // Promo code in cart & checkout
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isPromoFreeShipping, setIsPromoFreeShipping] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  // Cart totals
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }, [cartItems]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, i) => acc + i.quantity, 0);
  }, [cartItems]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('eshop_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error(err);
    }
  }, [cartItems]);

  // Sync wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('eshop_wishlist', JSON.stringify(wishlist));
    } catch (err) {
      console.error(err);
    }
  }, [wishlist]);

  // Auto-recalculate promo discount when cart subtotal changes
  useEffect(() => {
    if (discountCode) {
      const res = validatePromoCode(discountCode, cartSubtotal);
      if (res.valid) {
        setDiscountAmount(res.discountAmount);
        setIsPromoFreeShipping(res.isFreeShipping);
        setPromoMessage(res.message);
      } else {
        // Condition no longer met after item removal
        setDiscountCode('');
        setDiscountAmount(0);
        setIsPromoFreeShipping(false);
        setPromoMessage('');
      }
    }
  }, [cartSubtotal, discountCode]);

  // Cart operations with variant support
  const handleAddToCart = (product, quantity = 1, variant = null) => {
    const itemKey = variant && (variant.size || variant.color)
      ? `${product.id}-${variant.size || ''}-${variant.color || ''}`
      : product.id;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === itemKey || (item.id === product.id && !variant && !item.selectedSize));
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          key: itemKey,
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          selectedSize: variant?.size || null,
          selectedColor: variant?.color || null,
          quantity
        }
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (keyOrId, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        (item.key === keyOrId || item.id === keyOrId) ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveFromCart = (keyOrId) => {
    setCartItems((prev) => prev.filter((item) => item.key !== keyOrId && item.id !== keyOrId));
  };

  const handleToggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleApplyPromo = (code) => {
    const res = validatePromoCode(code, cartSubtotal);
    if (res.valid) {
      setDiscountCode(res.code);
      setDiscountAmount(res.discountAmount);
      setIsPromoFreeShipping(res.isFreeShipping);
      setPromoMessage(res.message);
    }
    return res;
  };

  const handleRemovePromo = () => {
    setDiscountCode('');
    setDiscountAmount(0);
    setIsPromoFreeShipping(false);
    setPromoMessage('');
  };

  // Direct checkout handler (Buy Now button from PDP)
  const handleDirectCheckout = (product, quantity = 1, variant = null) => {
    handleAddToCart(product, quantity, variant);
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order) => {
    const earned = calculatePointsForAmount(order?.totalAmount || finalCheckoutAmount);
    if (earned > 0) {
      setLoyaltyState((prev) => ({
        ...prev,
        points: prev.points + earned,
        history: [
          {
            id: `order-${order?.orderNumber || Date.now()}`,
            date: new Date().toLocaleDateString('fr-FR'),
            label: `Commande ${order?.orderNumber || ''}`,
            points: earned,
            type: 'credit'
          },
          ...prev.history
        ]
      }));
    }
    setCartItems([]);
    setDiscountCode('');
    setDiscountAmount(0);
    setIsPromoFreeShipping(false);
    setPromoMessage('');
  };

  const isFreeShipping = cartSubtotal >= 40.0 || isPromoFreeShipping || cartSubtotal === 0;
  const shippingFee = isFreeShipping ? 0.0 : 3.90;
  const finalCheckoutAmount = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // Active tracking order number if user clicks "Suivre ma commande" from Checkout
  const [trackingOrderNumber, setTrackingOrderNumber] = useState(null);

  const handleOpenTrackingWithOrder = (orderNum) => {
    setTrackingOrderNumber(orderNum);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);
  };

  // View Navigation Helpers with Browser URL Sync & Instant Scroll-To-Top
  const scrollToPageTop = () => {
    try {
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.documentElement.style.scrollBehavior = prevBehavior;
      }, 40);
    } catch {
      window.scrollTo(0, 0);
    }
  };

  // Guarantee every page view starts from the very top on navigation
  useEffect(() => {
    scrollToPageTop();
  }, [activeView, selectedCategory, selectedSubcategory]);

  const handleOpenShop = (category = 'all', subcategory = null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setActiveView('shop');

    const targetUrl = category === 'all' ? '/shop' : `/${category}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ category, subcategory }, '', targetUrl);
    }

    scrollToPageTop();
  };

  const handleNavigateHome = () => {
    setActiveView('home');
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSearchQuery('');

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    scrollToPageTop();
  };

  const handleOpenAdmin = () => {
    setActiveView('admin');
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    scrollToPageTop();
  };

  const handleOpenAccount = (tab = 'orders') => {
    setAccountInitialTab(tab);
    setActiveView('account');
    if (window.location.pathname !== '/account') {
      window.history.pushState({}, '', '/account');
    }
    scrollToPageTop();
  };

  // =========================================================================
  // Homepage Curated Product Slices (Section 13 & 19 Order: 4–8 products max)
  // =========================================================================
  // Curated Homepage Slices: Maximum 4 products each (1 per collection)
  // Tech & Gadgets, Maison & Cuisine, Beauté & Lifestyle, Voyage & Auto
  // =========================================================================
  const bestSellers = useMemo(() => {
    const ids = [
      'batterie-externe-compacte-10000', // Tech & Gadgets
      'blender-portable-rechargeable',    // Maison & Cuisine
      'rouleau-boucles-sans-chaleur',     // Beauté & Lifestyle
      'aspirateur-voiture-sans-fil'       // Voyage, Auto & Outdoor
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, []);

  const trendingProducts = useMemo(() => {
    const ids = [
      'support-telephone-voiture',        // Tech & Gadgets
      'brosse-nettoyage-electrique',      // Maison & Cuisine
      'rouleau-glace-visage',             // Beauté & Lifestyle
      'cubes-rangement-valise'            // Voyage, Auto & Outdoor
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, []);

  const newArrivals = useMemo(() => {
    const ids = [
      'mini-imprimante-thermique-bluetooth', // Tech & Gadgets
      'lunch-box-electrique-chauffante',     // Maison & Cuisine
      'defroisseur-vapeur-portable',          // Beauté & Lifestyle
      'ventilateur-cou-rechargeable'          // Voyage, Auto & Outdoor
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }, []);

  const renderProductCard = (product) => (
    <ProductCard
      key={product.id}
      product={product}
      onOpenDetails={(p) => setSelectedProduct(p)}
      onAddToCart={(p) => handleAddToCart(p, 1)}
      isWishlisted={wishlist.includes(product.id)}
      onToggleWishlist={handleToggleWishlist}
      isCompared={compareList.includes(product.id)}
      onToggleCompare={handleToggleCompare}
    />
  );

  return (
    <div className="app-layout">
      {/* Top EU Shipping & Free Delivery Announcement Bar */}
      <AnnouncementBar
        cartSubtotal={cartSubtotal}
        onOpenReassurance={() => setIsReassuranceOpen(true)}
        lang={currentLang}
      />

      {/* 1. Header (Primary & Secondary Nav, Autocomplete Search, Mobile Menu) */}
      <Header
        cartCount={totalCartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCategory={handleOpenShop}
        onOpenShop={handleOpenShop}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenReassurance={() => setIsReassuranceOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        loyaltyPoints={loyaltyState.points}
        onNavigateHome={handleNavigateHome}
        activeView={activeView}
        selectedCategory={selectedCategory}
        lang={currentLang}
        setLang={setCurrentLang}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenAdmin={handleOpenAdmin}
        onOpenAccount={handleOpenAccount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content */}
      <main>
        {activeView === 'admin' ? (
          /* ========================================================
             EXECUTIVE ADMIN BACK-OFFICE VIEW (/admin)
             ======================================================== */
          <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: '#64748b' }}>Chargement du panneau d'administration...</div>}>
            <AdminDashboard
              onNavigateHome={handleNavigateHome}
              currentUser={currentUser}
              onAuthSuccess={handleAuthSuccess}
              onLogout={handleLogout}
              onOpenTrackingWithOrder={handleOpenTrackingWithOrder}
            />
          </Suspense>
        ) : activeView === 'account' ? (
          /* ========================================================
             CUSTOMER MY ACCOUNT VIEW (/account, /mon-compte)
             ======================================================== */
          <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: '#64748b' }}>Chargement de votre compte...</div>}>
            <AccountPage
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onLogout={handleLogout}
              onNavigateHome={handleNavigateHome}
              onOpenShop={handleOpenShop}
              onOpenTrackingWithOrder={handleOpenTrackingWithOrder}
              onOpenLoyalty={() => setIsLoyaltyOpen(true)}
              onAddToCart={handleAddToCart}
              onOpenAuth={handleOpenAuth}
              initialTab={accountInitialTab}
            />
          </Suspense>
        ) : activeView === 'shop' ? (
          /* ========================================================
             DEDICATED CATALOGUE / CATEGORY VIEW (/shop, /mode, ...)
             ======================================================== */
          <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: '#64748b' }}>Chargement du catalogue...</div>}>
            <CataloguePage
              products={PRODUCTS}
              initialCategory={selectedCategory}
              initialSubcategory={selectedSubcategory}
              initialSearch={searchQuery}
              onOpenDetails={(p) => setSelectedProduct(p)}
              onAddToCart={(p, qty, variant) => handleAddToCart(p, qty, variant)}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onNavigateHome={handleNavigateHome}
              onSelectCategory={handleOpenShop}
              compareList={compareList}
              onToggleCompare={handleToggleCompare}
            />
          </Suspense>
        ) : activeView === '404' ? (
          /* ========================================================
             CUSTOM 404 NOT FOUND VIEW
             ======================================================== */
          <div className="container" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '4.5rem', fontWeight: '900', color: '#2563eb', lineHeight: 1, marginBottom: '1rem' }}>
              404
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary, #0f172a)', marginBottom: '0.75rem' }}>
              Page introuvable
            </h1>
            <p style={{ maxWidth: '480px', color: 'var(--text-secondary, #64748b)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée. Retrouvez tous nos gadgets pratiques sur notre catalogue officiel.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleNavigateHome}
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                Retour à l'accueil
              </button>
              <button
                type="button"
                onClick={() => handleOpenShop('all')}
                className="btn btn-outline"
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                Explorer le catalogue
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             EXACT HOMEPAGE HIERARCHY (Sections 14, 15, 16, 17)
             ======================================================== */
          <>
            {/* 1. Hero Banner */}
            <HeroBanner
              onExploreProducts={() => handleOpenShop('all')}
              onExploreNewArrivals={() => handleOpenShop('mode')}
              onSelectProduct={(id) => {
                const prod = PRODUCTS.find((p) => p.id === id);
                if (prod) setSelectedProduct(prod);
              }}
            />

            {/* 2. Shop by Collection (4 Primary Collections Grid) */}
            <section className="homepage-section category-discovery-section">
              <div className="container">
                <SectionHeader
                  title="Nos 4 Collections"
                  subtitle="Une sélection rigoureuse d'objets astucieux pour simplifier et moderniser votre quotidien."
                  actionText="Explorer la boutique"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="category-grid-modern four-collections-grid">
                  {MAIN_CATEGORIES.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      onSelect={(catId) => handleOpenShop(catId)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Nos meilleures ventes (Maximum 4 products) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Nos meilleures ventes"
                  subtitle="Les essentiels les plus plébiscités par nos clients à travers l'Europe."
                  actionText="Voir toute la boutique"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {bestSellers.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 4. Produits tendance (Maximum 4 products) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Produits tendance"
                  subtitle="Des innovations pratiques et ingénieuses qui facilitent la vie de tous les jours."
                  actionText="Découvrir les tendances"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {trendingProducts.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 5. Nouveautés (Maximum 4 products) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Nouveautés"
                  subtitle="Les dernières trouvailles utiles ajoutées à notre catalogue sélectionné."
                  actionText="Voir toutes les nouveautés"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {newArrivals.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 6. Value proposition / trust section */}
            <TrustBar
              onOpenReassurance={() => setIsReassuranceOpen(true)}
              lang={currentLang}
            />
            <WhyChooseUs onOpenReassurance={() => setIsReassuranceOpen(true)} />
            <ReviewsSection />

            {/* 7. Newsletter or CTA */}
            <NewsletterSection />
          </>
        )}
      </main>

      {/* Footer (4-column structure with 10 categories) */}
      <Footer
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setIsLegalOpen(true);
        }}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onSelectCategory={(catId) => handleOpenShop(catId)}
        onOpenAbout={() => setIsAboutOpen(true)}
        lang={currentLang}
      />

      {/* Slide-In Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onAddToCart={handleAddToCart}
        discountCode={discountCode}
        discountAmount={discountAmount}
        isPromoFreeShipping={isPromoFreeShipping}
        promoMessage={promoMessage}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={handleRemovePromo}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        onOpenShop={(catId) => handleOpenShop(catId || 'all')}
        lang={currentLang}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty, variant) => {
          handleAddToCart(prod, qty, variant);
          setSelectedProduct(null);
        }}
        onDirectCheckout={handleDirectCheckout}
        onOpenReassurance={() => setIsReassuranceOpen(true)}
        isCompared={selectedProduct ? compareList.includes(selectedProduct.id) : false}
        onToggleCompare={handleToggleCompare}
        onOpenCompare={() => {
          setSelectedProduct(null);
          setIsCompareModalOpen(true);
        }}
      />

      {/* 3-Step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        shippingFee={shippingFee}
        isFreeShipping={isFreeShipping}
        totalAmount={finalCheckoutAmount}
        discountCode={discountCode}
        discountAmount={discountAmount}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={handleRemovePromo}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracking={handleOpenTrackingWithOrder}
        currentUser={currentUser}
      />

      {/* Order Tracking Modal */}
      {isTrackingOpen && (
        <Suspense fallback={null}>
          <OrderTracking
            isOpen={isTrackingOpen}
            initialOrderNumber={trackingOrderNumber}
            onClose={() => {
              setIsTrackingOpen(false);
              setTrackingOrderNumber(null);
            }}
          />
        </Suspense>
      )}

      {/* Legal & Compliance Modal */}
      {isLegalOpen && (
        <Suspense fallback={null}>
          <LegalPagesModal
            isOpen={isLegalOpen}
            initialTab={legalTab}
            onClose={() => setIsLegalOpen(false)}
          />
        </Suspense>
      )}

      {/* Engagements & Garanties UE Popup Modal */}
      {isReassuranceOpen && (
        <Suspense fallback={null}>
          <ReassuranceModal
            isOpen={isReassuranceOpen}
            onClose={() => setIsReassuranceOpen(false)}
            onOpenLegal={(tab) => {
              setLegalTab(tab);
              setIsLegalOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* About & Brand Story Modal */}
      {isAboutOpen && (
        <Suspense fallback={null}>
          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
            lang={currentLang}
            onOpenShop={handleOpenShop}
            onOpenReassurance={() => setIsReassuranceOpen(true)}
          />
        </Suspense>
      )}

      {/* Loyalty & Referral Modal */}
      {isLoyaltyOpen && (
        <Suspense fallback={null}>
          <LoyaltyModal
            isOpen={isLoyaltyOpen}
            onClose={() => setIsLoyaltyOpen(false)}
            loyaltyState={loyaltyState}
            onClaimReward={handleClaimReward}
            onApplyPromoCode={(c) => handleApplyPromo(c)}
            lang={currentLang}
          />
        </Suspense>
      )}

      {/* Authentication & Customer Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        onOpenLoyalty={() => {
          setIsAuthModalOpen(false);
          setIsLoyaltyOpen(true);
        }}
      />

      {/* Automated Support Chatbot Widget */}
      <ChatWidget
        lang={currentLang}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenShop={handleOpenShop}
        onOpenReassurance={() => setIsReassuranceOpen(true)}
      />

      {/* Floating Product Comparison Bar */}
      <CompareFloatingBar
        compareList={compareList}
        products={PRODUCTS}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onRemoveItem={handleRemoveCompareItem}
        onClearAll={handleClearCompare}
      />

      {/* Full Side-by-Side Product Comparison Modal */}
      {isCompareModalOpen && (
        <Suspense fallback={null}>
          <ProductCompareModal
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
            compareList={compareList}
            products={PRODUCTS}
            onAddToCart={(prod) => {
              handleAddToCart(prod, 1);
              showCompareToast(`« ${prod.name} » ajouté au panier !`);
            }}
            onRemoveItem={handleRemoveCompareItem}
            onClearAll={handleClearCompare}
            onOpenDetails={(prod) => {
              setIsCompareModalOpen(false);
              setSelectedProduct(prod);
            }}
          />
        </Suspense>
      )}

      {/* Floating Compare Action Toast */}
      {compareToastMsg && (
        <div className="compare-toast-notification animate-fade-in" role="status">
          <span>{compareToastMsg}</span>
        </div>
      )}

      {/* Abandoned Cart Exit-Intent Modal */}
      {isAbandonedCartOpen && (
        <Suspense fallback={null}>
          <AbandonedCartModal
            isOpen={isAbandonedCartOpen}
            onClose={() => setIsAbandonedCartOpen(false)}
            items={cartItems}
            subtotal={cartSubtotal}
            onApplyDiscountAndCheckout={handleApplyDiscountAndCheckout}
            onApplyDiscountAndStay={handleApplyDiscountAndStay}
          />
        </Suspense>
      )}

      {/* Social Proof Live Purchase Reassurance Toasts */}
      <LivePurchaseToasts
        products={PRODUCTS}
        onOpenProduct={(prod) => setSelectedProduct(prod)}
      />

      {/* EU GDPR Cookie Consent Banner & Privacy Center */}
      <CookieBanner onOpenPrivacyPolicy={() => handleOpenLegal('rgpd')} />

      {/* Floating Trust Badge Button */}
      <button
        onClick={() => setIsReassuranceOpen(true)}
        title="Voir nos engagements & garanties UE"
        className="floating-trust-pill"
      >
        <ShieldCheck size={16} color="#10b981" />
        <span>Garanties UE 🇪🇺</span>
      </button>
    </div>
  );
}

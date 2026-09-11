import React, { useState, useEffect, useMemo } from 'react';
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

// Dedicated Catalogue View
import CataloguePage from './components/CataloguePage';

// Modals & Drawers
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTracking from './components/OrderTracking';
import LegalPagesModal from './components/LegalPagesModal';
import ReassuranceModal from './components/ReassuranceModal';
import AboutModal from './components/AboutModal';
import ChatWidget from './components/ChatWidget';
import LoyaltyModal from './components/LoyaltyModal';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import AccountPage from './components/AccountPage';
import CompareFloatingBar from './components/CompareFloatingBar';
import ProductCompareModal from './components/ProductCompareModal';
import AbandonedCartModal from './components/AbandonedCartModal';
import LivePurchaseToasts from './components/LivePurchaseToasts';
import CookieBanner from './components/CookieBanner';

// Services & API
import { apiGetMe, apiLogout } from './services/api';
import { onFirebaseAuthStateChange, firebaseSignOutUser } from './services/firebase';

// Data
import { PRODUCTS } from './data/products';
import { MAIN_CATEGORIES } from './data/categories';
import { ShieldCheck } from 'lucide-react';
import { validatePromoCode } from './data/promoCodes';
import { INITIAL_LOYALTY_STATE, calculatePointsForAmount } from './data/loyalty';

const VALID_CATEGORY_SLUGS = [
  'mode',
  'beaute',
  'technologie',
  'maison',
  'animaux',
  'sport',
  'auto',
  'securite',
  'voyage',
  'accessoires'
];

export default function App() {
  // Navigation / View state initialized from URL pathname if present
  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (path === 'admin') {
      return 'admin';
    }
    if (path === 'account' || path === 'mon-compte') {
      return 'account';
    }
    if (VALID_CATEGORY_SLUGS.includes(path) || path === 'shop') {
      return 'shop';
    }
    return 'home';
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
      } else {
        setActiveView('home');
        setSelectedCategory('all');
        setSelectedSubcategory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState(null);

  // Restore authenticated session on app load (Firebase + Local)
  useEffect(() => {
    let isMounted = true;

    // 1. Listen to Firebase Auth (Email, Google, Apple)
    const unsubscribeFirebase = onFirebaseAuthStateChange((fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        setCurrentUser(fbUser);
        if (fbUser.loyaltyPoints !== undefined) {
          setLoyaltyState((prev) => ({
            ...prev,
            points: fbUser.loyaltyPoints,
            referralCode: fbUser.loyaltyCode || prev.referralCode
          }));
        }
      }
    });

    // 2. Also check local/demo session if Firebase hasn't hydrated a user
    apiGetMe()
      .then((user) => {
        if (isMounted && user && !currentUser) {
          setCurrentUser(user);
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

  // View Navigation Helpers with Browser URL Sync
  const handleOpenShop = (category = 'all', subcategory = null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setActiveView('shop');

    const targetUrl = category === 'all' ? '/shop' : `/${category}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ category, subcategory }, '', targetUrl);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActiveView('home');
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSearchQuery('');

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setActiveView('admin');
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAccount = (tab = 'orders') => {
    setAccountInitialTab(tab);
    setActiveView('account');
    if (window.location.pathname !== '/account') {
      window.history.pushState({}, '', '/account');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // Homepage Curated Product Slices (Section 13 & 19 Order: 4–8 products max)
  // Balanced across departments to avoid repetitive clustering
  // =========================================================================
  const incontournables = useMemo(() => {
    const priorityIds = [
      'support-ordinateur-portable',      // Technologie (Aluminium stand dedicated packshot)
      'support-telephone-voiture',        // Auto (Dedicated packshot)
      'aspirateur-voiture-sans-fil',      // Auto (Dedicated packshot)
      'ecouteurs-bluetooth-pro',          // Technologie (Sharp earbuds packshot)
      'pulverisateur-huile',              // Maison (Glass oil sprayer packshot)
      'rouleau-boucles-sans-chaleur',     // Beauté (Dedicated packshot)
      'organisateur-maquillage',          // Beauté (360 acrylic organizer packshot)
      'ceinture-course'                   // Sport (Running belt packshot)
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = priorityIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 8 ? list : PRODUCTS.slice(0, 8);
  }, []);

  const bestSellers = useMemo(() => {
    const curatedIds = [
      'robe-fluide-ete',                  // Mode (Terracotta wrap dress)
      'doublures-silicone-airfryer',      // Maison (Silicone liners packshot)
      'repose-pieds-ergonomique',         // Technologie (Ergonomic footrest packshot)
      'rouleau-glace-visage',             // Beauté (Ice/jade roller tool)
      'brosse-anti-poils',                // Animaux (Pet brush packshot)
      'porte-cartes-aluminium-anti-rfid', // Accessoires (Metal RFID card holder)
      'camera-surveillance-wifi',         // Sécurité (360 wifi camera packshot)
      'cubes-rangement-valise'            // Voyage (Compression cubes packshot)
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 8 ? list : PRODUCTS.filter((p) => p.isBestSeller).slice(0, 8);
  }, []);

  const fashionTrending = useMemo(() => {
    const curatedModeIds = [
      'robe-fluide-ete',                  // Femme
      't-shirt-oversize-coton',           // Femme (Packshot)
      'jean-slim-confort',                // Femme (Packshot)
      'ensemble-lounge-confort',          // Femme (Packshot)
      'chemise-lin-homme',                // Homme (Packshot)
      'polo-coton-homme',                 // Homme (Packshot)
      'pantalon-chino-stretch',           // Homme (Chinos model)
      'baskets-casual-respirantes'        // Chaussures (Sneakers)
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedModeIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 8 ? list : PRODUCTS.filter((p) => p.category === 'mode').slice(0, 8);
  }, []);

  const techAndGadgets = useMemo(() => {
    const curatedTechIds = [
      'support-ordinateur-portable',      // Support PC aluminium
      'hub-usb-c-7en1',                   // Hub USB-C
      'ecouteurs-bluetooth-pro',          // Écouteurs sans fil
      'souris-sans-fil-ergonomique'       // Souris ergonomique
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedTechIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'technologie').slice(0, 4);
  }, []);

  const homeAndKitchen = useMemo(() => {
    const curatedHomeIds = [
      'doublures-silicone-airfryer',
      'pulverisateur-huile',
      'accessoires-airfryer',
      'organisateur-sous-evier'
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedHomeIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'maison').slice(0, 4);
  }, []);

  const beautyAndWellness = useMemo(() => {
    const curatedBeautyIds = [
      'rouleau-glace-visage',
      'rouleau-boucles-sans-chaleur',
      'brosse-nettoyante-visage',
      'organisateur-maquillage'
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedBeautyIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'beaute').slice(0, 4);
  }, []);

  const petEssentials = useMemo(() => {
    const curatedPetIds = [
      'brosse-anti-poils',
      'rouleau-anti-peluches',
      'nettoyeur-pattes-chiens',
      'gourde-portable-chiens'
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedPetIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'animaux').slice(0, 4);
  }, []);

  const sportAndFitness = useMemo(() => {
    const curatedSportIds = [
      'ceinture-course',                  // Ceinture running
      'sacoche-velo',                     // Sacoche cadre vélo
      'tapis-yoga-antiderapant-tpe',      // Tapis yoga
      'bandeaux-fitness'                  // Bandes de résistance
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedSportIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'sport').slice(0, 4);
  }, []);

  const smartHomeAndSecurity = useMemo(() => {
    const curatedSecurityIds = [
      'camera-surveillance-wifi',
      'sonnette-video-connectee',
      'prise-connectee-wifi',
      'detecteur-mouvement-connecte'
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedSecurityIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.category === 'securite').slice(0, 4);
  }, []);

  const newArrivals = useMemo(() => {
    const curatedNewIds = [
      'chargeur-voiture-usb-c-60w',       // Auto (New car lighter charger packshot)
      'ceinture-cuir-automatique',        // Accessoires (New leather belt packshot)
      'oreiller-voyage-memoire',          // Voyage (New travel memory foam pillow packshot)
      'trousse-toilette-suspendue'        // Voyage (New hanging toiletry packshot)
    ];
    const map = new Map(PRODUCTS.map((p) => [p.id, p]));
    const list = curatedNewIds.map((id) => map.get(id)).filter(Boolean);
    return list.length === 4 ? list : PRODUCTS.filter((p) => p.isNew).slice(0, 4);
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
          <AdminDashboard
            onNavigateHome={handleNavigateHome}
            currentUser={currentUser}
            onOpenTrackingWithOrder={handleOpenTrackingWithOrder}
          />
        ) : activeView === 'account' ? (
          /* ========================================================
             CUSTOMER MY ACCOUNT VIEW (/account, /mon-compte)
             ======================================================== */
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
        ) : activeView === 'shop' ? (
          /* ========================================================
             DEDICATED CATALOGUE / CATEGORY VIEW (/shop, /mode, ...)
             ======================================================== */
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

            {/* 2. Trust Bar (4 key pillars) */}
            <TrustBar
              onOpenReassurance={() => setIsReassuranceOpen(true)}
              lang={currentLang}
            />

            {/* 3. Shoppez par catégorie (10 Main Categories Grid) */}
            <section className="homepage-section category-discovery-section">
              <div className="container">
                <SectionHeader
                  title="Shoppez par catégorie"
                  subtitle="Explorez nos 10 départements soigneusement sélectionnés."
                  actionText="Voir tout le catalogue"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="category-grid-modern">
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

            {/* 4. Les incontournables (Section 13 & 19: 4–8 fast-selling priority products) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Les incontournables"
                  subtitle="Notre sélection des produits tendance les plus plébiscités pour leur utilité au quotidien."
                  actionText="Découvrir la sélection →"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {incontournables.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 5. Nos meilleures ventes (4–8 produits maximum) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Nos meilleures ventes"
                  subtitle="Les produits plébiscités par nos clients à travers l'Europe."
                  actionText="Voir toutes les meilleures ventes"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {bestSellers.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 5. Mode tendance (Section 16: 4–8 products maximum) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Mode tendance"
                  subtitle="Découvrez les essentiels du moment pour femme et homme."
                  actionText="Voir toute la mode →"
                  onAction={() => handleOpenShop('mode')}
                />

                <div className="products-grid-standardized">
                  {fashionTrending.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 6. Gadgets & Technologie (Section 17: 4–8 products maximum) */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Gadgets & Technologie"
                  subtitle="Des accessoires haute performance pour simplifier votre quotidien."
                  actionText="Voir toute la technologie →"
                  onAction={() => handleOpenShop('technologie')}
                />

                <div className="products-grid-standardized">
                  {techAndGadgets.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* Promotional Banner #1 */}
            <PromoBanner
              badge="Innovation & Quotidien"
              title="Des gadgets utiles et fiables au quotidien"
              description="Connectivité USB-C, charge rapide et accessoires intelligents conçus pour simplifier votre journée au bureau comme en déplacement."
              ctaText="Découvrir la sélection Technologie"
              image="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80"
              onAction={() => handleOpenShop('technologie')}
            />

            {/* 7. Maison & Cuisine */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Maison & Cuisine"
                  subtitle="Air fryer, rangements et ustensiles ingénieux pour une maison organisée."
                  actionText="Voir toute la collection Maison →"
                  onAction={() => handleOpenShop('maison')}
                />

                <div className="products-grid-standardized">
                  {homeAndKitchen.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 8. Beauté & Bien-être */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Beauté & Bien-être"
                  subtitle="Des soins simples, doux et innovants pour votre rituel à la maison."
                  actionText="Voir les produits Beauté →"
                  onAction={() => handleOpenShop('beaute')}
                />

                <div className="products-grid-standardized">
                  {beautyAndWellness.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 9. Animaux */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Nos amis les animaux"
                  subtitle="Brosses de toilettage autonettoyantes, gourdes et accessoires pour chiens et chats."
                  actionText="Voir tous les accessoires Animaux →"
                  onAction={() => handleOpenShop('animaux')}
                />

                <div className="products-grid-standardized">
                  {petEssentials.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 10. Sport & Fitness */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Sport & Fitness"
                  subtitle="Accessoires running, tapis de yoga et équipements sportifs pour rester actif."
                  actionText="Voir les équipements Sport →"
                  onAction={() => handleOpenShop('sport')}
                />

                <div className="products-grid-standardized">
                  {sportAndFitness.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 11. Sécurité & Maison intelligente */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Sécurité & Maison intelligente"
                  subtitle="Caméras haute définition 360°, sonnettes vidéo et prises connectées."
                  actionText="Voir les solutions Sécurité →"
                  onAction={() => handleOpenShop('securite')}
                />

                <div className="products-grid-standardized">
                  {smartHomeAndSecurity.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 12. Nouveautés */}
            <section className="homepage-section">
              <div className="container">
                <SectionHeader
                  title="Nouveautés"
                  subtitle="Les dernières innovations pratiques ajoutées à notre boutique européenne."
                  actionText="Voir toutes les nouveautés →"
                  onAction={() => handleOpenShop('all')}
                />

                <div className="products-grid-standardized">
                  {newArrivals.map(renderProductCard)}
                </div>
              </div>
            </section>

            {/* 13. Why Choose Us (4 pillars) */}
            <WhyChooseUs onOpenReassurance={() => setIsReassuranceOpen(true)} />

            {/* 14. Customer Reviews Section */}
            <ReviewsSection />

            {/* 15. Newsletter Section */}
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
      <OrderTracking
        isOpen={isTrackingOpen}
        initialOrderNumber={trackingOrderNumber}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingOrderNumber(null);
        }}
      />

      {/* Legal & Compliance Modal */}
      <LegalPagesModal
        isOpen={isLegalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalOpen(false)}
      />

      {/* Engagements & Garanties UE Popup Modal */}
      <ReassuranceModal
        isOpen={isReassuranceOpen}
        onClose={() => setIsReassuranceOpen(false)}
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setIsLegalOpen(true);
        }}
      />

      {/* About & Brand Story Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        lang={currentLang}
        onOpenShop={handleOpenShop}
        onOpenReassurance={() => setIsReassuranceOpen(true)}
      />

      {/* Loyalty & Referral Modal */}
      <LoyaltyModal
        isOpen={isLoyaltyOpen}
        onClose={() => setIsLoyaltyOpen(false)}
        loyaltyState={loyaltyState}
        onClaimReward={handleClaimReward}
        onApplyPromoCode={(c) => handleApplyPromo(c)}
        lang={currentLang}
      />

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

      {/* Floating Compare Action Toast */}
      {compareToastMsg && (
        <div className="compare-toast-notification animate-fade-in" role="status">
          <span>{compareToastMsg}</span>
        </div>
      )}

      {/* Abandoned Cart Exit-Intent Modal */}
      <AbandonedCartModal
        isOpen={isAbandonedCartOpen}
        onClose={() => setIsAbandonedCartOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        onApplyDiscountAndCheckout={handleApplyDiscountAndCheckout}
        onApplyDiscountAndStay={handleApplyDiscountAndStay}
      />

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

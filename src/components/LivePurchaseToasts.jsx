import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, ShoppingBag, MapPin } from 'lucide-react';

const LIVE_PURCHASES = [
  {
    productId: 'accessoires-airfryer',
    buyer: 'Sophie M.',
    city: 'Lyon, France',
    flag: '🇫🇷',
    timeAgo: 'il y a 4 min'
  },
  {
    productId: 'aspirateur-sans-fil-cyclonique',
    buyer: 'Lucas V.',
    city: 'Bruxelles, Belgique',
    flag: '🇧🇪',
    timeAgo: 'il y a 8 min'
  },
  {
    productId: 'oreiller-ergonomique-memoire-forme',
    buyer: 'Elena G.',
    city: 'Madrid, Espagne',
    flag: '🇪🇸',
    timeAgo: 'il y a 12 min'
  },
  {
    productId: 'batterie-externe-magsafe-10000mah',
    buyer: 'Thomas K.',
    city: 'Genève, Suisse',
    flag: '🇨🇭',
    timeAgo: 'il y a 17 min'
  },
  {
    productId: 'bandeau-spa-microfibre',
    buyer: 'Camille D.',
    city: 'Bordeaux, France',
    flag: '🇫🇷',
    timeAgo: 'il y a 23 min'
  },
  {
    productId: 'brosse-poils-animaux-autonettoyante',
    buyer: 'Matteo R.',
    city: 'Milan, Italie',
    flag: '🇮🇹',
    timeAgo: 'il y a 29 min'
  },
  {
    productId: 'support-telephone-voiture-induction',
    buyer: 'Jan N.',
    city: 'Amsterdam, Pays-Bas',
    flag: '🇳🇱',
    timeAgo: 'il y a 34 min'
  },
  {
    productId: 'camera-surveillance-wifi-360',
    buyer: 'Alexander B.',
    city: 'Berlin, Allemagne',
    flag: '🇩🇪',
    timeAgo: 'il y a 41 min'
  }
];

export default function LivePurchaseToasts({ products = [], onOpenProduct }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('eshop_dismiss_live_toasts') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDismissed) return;

    // Initial delay before first toast appears (7 seconds)
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 7000);

    return () => clearTimeout(initialTimer);
  }, [isDismissed]);

  useEffect(() => {
    if (isDismissed) return;

    let hideTimer;
    let nextTimer;

    if (isVisible) {
      // Stay visible for 6 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);
        // Wait 20 seconds before showing next purchase toast
        nextTimer = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % LIVE_PURCHASES.length);
          setIsVisible(true);
        }, 20000);
      }, 6000);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [isVisible, isDismissed]);

  if (isDismissed || !isVisible) return null;

  const currentPurchase = LIVE_PURCHASES[currentIndex];
  const product = products.find((p) => p.id === currentPurchase.productId);

  if (!product) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('eshop_dismiss_live_toasts', 'true');
    } catch (err) {
      console.warn('Failed to save toast dismiss', err);
    }
  };

  return (
    <aside
      aria-label="Notification d'achat récent"
      className="live-purchase-toast animate-slide-up"
      onClick={() => {
        if (onOpenProduct) {
          onOpenProduct(product);
        }
      }}
      role="status"
    >
      {/* Product Thumbnail */}
      <div className="live-toast-thumb-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="live-toast-img"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
          }}
        />
        <div className="live-toast-pulse-dot" />
      </div>

      {/* Content */}
      <div className="live-toast-body">
        <div className="live-toast-header">
          <span className="live-buyer-info">
            <strong>{currentPurchase.buyer}</strong> à {currentPurchase.city} {currentPurchase.flag}
          </span>
          <span className="live-time-ago">{currentPurchase.timeAgo}</span>
        </div>

        <p className="live-product-name" title={product.name}>
          A commandé : <strong>{product.name}</strong>
        </p>

        <div className="live-toast-footer">
          <span className="live-verified-badge">
            <CheckCircle2 size={12} color="#059669" />
            <span>Achat vérifié UE</span>
          </span>
          <span className="live-view-hint">Voir le produit ➔</span>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        className="live-toast-close-btn"
        onClick={handleDismiss}
        title="Masquer les notifications d'achats"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </aside>
  );
}

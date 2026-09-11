import React from 'react';
import { Star, ShoppingBag, Heart, ArrowLeftRight } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

export default function ProductCard({
  product,
  onOpenDetails,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isCompared = false,
  onToggleCompare
}) {
  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Single badge priority: explicit product.badge > discount percent
  const badgeText = product.badge || (discountPercent >= 15 ? `-${discountPercent}%` : null);
  const isDiscountBadge = badgeText && (badgeText.startsWith('-') || badgeText.includes('%'));

  return (
    <article className="product-card-standardized" aria-label={product.name}>
      {/* 1:1 Image Container with consistent padding & background */}
      <div
        className={`product-img-frame ${product.imageDisplayMode === 'cover' ? 'frame-cover' : 'frame-contain'}`}
        data-mode={product.imageDisplayMode === 'cover' ? 'cover' : 'contain'}
        onClick={() => onOpenDetails(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDetails(product)}
      >
        <img
          src={product.image}
          alt={product.altText || product.name}
          className={`product-img-element ${product.imageDisplayMode === 'cover' ? 'fit-cover' : 'fit-contain'}`}
          data-mode={product.imageDisplayMode === 'cover' ? 'cover' : 'contain'}
          style={product.imageScale && product.imageDisplayMode !== 'cover' ? { transform: `scale(${product.imageScale})` } : undefined}
          width="400"
          height="400"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMAGE) {
              e.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
        />

        {/* Max single top-left badge */}
        {badgeText && (
          <span className={`product-card-badge ${isDiscountBadge ? 'badge-discount' : 'badge-neutral'}`}>
            {badgeText}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          className={`product-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#64748b'} />
        </button>

        {/* Compare Button */}
        {onToggleCompare && (
          <button
            className={`product-compare-btn ${isCompared ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product.id);
            }}
            title={isCompared ? 'Retirer du comparateur' : 'Comparer ce produit'}
            aria-label={isCompared ? 'Retirer du comparateur' : 'Comparer ce produit'}
          >
            <ArrowLeftRight size={15} color={isCompared ? '#ffffff' : '#64748b'} />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="product-card-body">
        {/* Category Label */}
        <span className="product-card-category">
          {product.categoryLabel || product.category}
        </span>

        {/* Product Title (Max 2 lines) */}
        <h3
          className="product-card-title"
          onClick={() => onOpenDetails(product)}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating & Review Count */}
        <div className="product-card-rating">
          <div className="stars-row">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span className="rating-score">{product.rating.toFixed(1)}</span>
          </div>
          <span className="review-count">({product.reviewCount})</span>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="product-card-footer">
          <div className="product-pricing-wrap">
            <span className="product-current-price">{product.price.toFixed(2)} €</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="product-old-price">
                {product.compareAtPrice.toFixed(2)} €
              </span>
            )}
          </div>

          <button
            className="product-quick-add-btn"
            onClick={() => onAddToCart(product)}
            title="Ajouter au panier"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingBag size={16} />
            <span className="btn-text">Ajouter</span>
          </button>
        </div>
      </div>
    </article>
  );
}

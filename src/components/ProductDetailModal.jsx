import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ShoppingBag,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { PRODUCTS } from '../data/products';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onDirectCheckout,
  onOpenAnotherProduct,
  onOpenReassurance
}) {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState(product.gallery?.[0] || product.image);
  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Variant selection states
  const [selectedSize, setSelectedSize] = useState(product.defaultSize || product.sizes?.[0] || null);
  const [selectedColor, setSelectedColor] = useState(
    product.defaultColor || product.colors?.[0]?.name || null
  );

  // Reset image and variants when product changes
  useEffect(() => {
    setSelectedImage(product.gallery?.[0] || product.image);
    setSelectedSize(product.defaultSize || product.sizes?.[0] || null);
    setSelectedColor(product.defaultColor || product.colors?.[0]?.name || null);
    setQuantity(1);
  }, [product]);

  // Bundle product resolution if any
  const bundleProduct = product.bundleWith
    ? PRODUCTS.find((p) => p.id === product.bundleWith)
    : null;

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCartWithVariants = () => {
    const variantInfo = {
      size: selectedSize,
      color: selectedColor
    };
    onAddToCart(product, quantity, variantInfo);
  };

  const handleDirectCheckoutWithVariants = () => {
    const variantInfo = {
      size: selectedSize,
      color: selectedColor
    };
    onDirectCheckout(product, quantity, variantInfo);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="modal-scroll-content">
          <div className="pdp-grid">
            {/* Gallery Column */}
            <div className="pdp-gallery">
              <img
                src={selectedImage}
                alt={product.altText || product.name}
                className="pdp-main-image"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                }}
              />

              {product.gallery && product.gallery.length > 1 && (
                <div className="pdp-thumbs">
                  {product.gallery.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} vue ${idx + 1}`}
                      className={`pdp-thumb ${selectedImage === img ? 'active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              )}

              {/* EU Stock Reassurance Micro-banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}
              >
                <Truck size={16} />
                <span>
                  {product.shippingEU || 'En stock dans nos entrepôts UE — Expédié sous 24h'}
                </span>
              </div>
            </div>

            {/* Details Column */}
            <div className="pdp-details">
              {/* Category & Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="pdp-category-tag">
                  {product.categoryLabel || product.category}
                </span>
                <div className="product-rating">
                  <Star size={14} className="stars-icon" />
                  <span style={{ fontWeight: 700 }}>{product.rating.toFixed(1)}</span>
                  <span>({product.reviewCount} avis vérifiés)</span>
                </div>
                {product.badge && (
                  <span className="product-badge" style={{ position: 'static' }}>
                    {product.badge}
                  </span>
                )}
              </div>

              <h2 className="pdp-title">{product.name}</h2>

              {/* Pricing */}
              <div className="pdp-price-box">
                <span className="pdp-current-price">{product.price.toFixed(2)} €</span>
                {product.compareAtPrice && (
                  <>
                    <span className="pdp-old-price">{product.compareAtPrice.toFixed(2)} €</span>
                    <span className="pdp-save-badge">Économisez -{discountPercent}%</span>
                  </>
                )}
              </div>

              {/* Short Description */}
              <p style={{ fontSize: '0.9375rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {product.shortDescription}
              </p>

              {/* FASHION VARIANTS: Colors & Sizes */}
              {product.colors && product.colors.length > 0 && (
                <div className="pdp-variant-block">
                  <div className="pdp-variant-header">
                    <span className="pdp-variant-label">Couleur :</span>
                    <span className="pdp-variant-chosen">{selectedColor}</span>
                  </div>
                  <div className="pdp-color-swatches">
                    {product.colors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`pdp-color-swatch ${selectedColor === c.name ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setSelectedColor(c.name)}
                        title={c.name}
                        aria-label={`Choisir couleur ${c.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="pdp-variant-block">
                  <div className="pdp-variant-header">
                    <span className="pdp-variant-label">Taille :</span>
                    <span className="pdp-variant-chosen">{selectedSize}</span>
                  </div>
                  <div className="pdp-size-chips">
                    {product.sizes.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`pdp-size-chip ${selectedSize === s ? 'active' : ''}`}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bullet Benefits */}
              {product.benefits && (
                <ul className="pdp-benefits-list">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="pdp-benefit-item">
                      <Check size={16} className="pdp-check-icon" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Quantity & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Quantité :</span>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Diminuer la quantité"
                    >
                      -
                    </button>
                    <span className="qty-val">{quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pdp-actions-grid">
                  <button
                    className="btn btn-primary"
                    onClick={handleAddToCartWithVariants}
                  >
                    <ShoppingBag size={18} />
                    <span>Ajouter au panier</span>
                  </button>

                  <button
                    className="btn btn-secondary pdp-btn-buy"
                    onClick={handleDirectCheckoutWithVariants}
                  >
                    <Zap size={18} color="#fbbf24" />
                    <span>Acheter maintenant</span>
                  </button>
                </div>
              </div>

              {/* Micro-Reassurance Icons */}
              <div
                onClick={onOpenReassurance}
                title="Cliquez pour voir le détail de nos garanties UE"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#475569',
                  marginBottom: '1.5rem',
                  cursor: onOpenReassurance ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease'
                }}
              >
                <div>
                  <Truck size={16} style={{ margin: '0 auto 2px', color: '#1e3a8a' }} />
                  <div style={{ fontWeight: 600 }}>Livraison 2-5j UE</div>
                </div>
                <div>
                  <ShieldCheck size={16} style={{ margin: '0 auto 2px', color: '#10b981' }} />
                  <div style={{ fontWeight: 600 }}>Garantie 2 ans</div>
                </div>
                <div>
                  <RotateCcw size={16} style={{ margin: '0 auto 2px', color: '#ea580c' }} />
                  <div style={{ fontWeight: 600 }}>Retours 14j ➔</div>
                </div>
              </div>

              {/* Specs Table */}
              {product.specs && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Caractéristiques & Spécifications
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      {Object.entries(product.specs).map(([key, val]) => (
                        <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem 0', color: '#64748b', fontWeight: 500, width: '40%' }}>
                            {key}
                          </td>
                          <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#1e293b' }}>
                            {val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Accordion FAQ */}
              {product.faq && product.faq.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Questions fréquentes
                  </h4>
                  {product.faq.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="accordion-item">
                        <button
                          className="accordion-trigger"
                          onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        >
                          <span>{item.q}</span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {isOpen && <div className="accordion-content">{item.a}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cross-sell Bundle Suggestion */}
              {bundleProduct && (
                <div
                  style={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#c2410c',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem'
                    }}
                  >
                    🎁 Pack recommandé — Économisez 15%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={bundleProduct.image}
                      alt={bundleProduct.altText || bundleProduct.name}
                      style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                        + {bundleProduct.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>
                        Combiné parfait pour seulement <strong>{bundleProduct.price.toFixed(2)} €</strong>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onAddToCart(bundleProduct, 1)}
                    >
                      <Plus size={14} />
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

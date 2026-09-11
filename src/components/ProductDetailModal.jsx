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
  Plus,
  ThumbsUp,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Loader2,
  Edit3,
  ArrowLeftRight
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { apiFetchProductReviews, apiSubmitProductReview, apiVoteReviewHelpful } from '../services/api';
import { updatePageSEO, injectProductJsonLd, injectBreadcrumbJsonLd, resetSEO } from '../services/seo';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onDirectCheckout,
  onOpenAnotherProduct,
  onOpenReassurance,
  isCompared = false,
  onToggleCompare,
  onOpenCompare
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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: product.rating || 4.8,
    totalReviews: product.reviews_count || product.reviewsCount || 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendationRate: 98
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [votedHelpfulIds, setVotedHelpfulIds] = useState(new Set());

  // New review form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    authorName: '',
    authorEmail: '',
    orderNumber: '',
    title: '',
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Fetch reviews when product changes
  useEffect(() => {
    if (!product?.id) return;
    setIsLoadingReviews(true);
    apiFetchProductReviews(product.id)
      .then((data) => {
        if (data && data.success) {
          setReviews(data.reviews || []);
          if (data.stats) {
            setReviewStats(data.stats);
          }
        }
      })
      .catch((err) => console.warn('Reviews fetch error:', err))
      .finally(() => setIsLoadingReviews(false));
  }, [product?.id]);

  // Synchronize dynamic SEO, OpenGraph and Schema.org Product Rich Snippet
  useEffect(() => {
    if (!product) return;
    const priceFormatted = Number(product.price || 0).toFixed(2);
    const title = `${product.name} • ${priceFormatted} € | eshop-store.eu`;
    const desc = product.shortDescription || product.short_description || `Achetez ${product.name} à ${priceFormatted} €. Expédition express UE en 2 à 5 jours, garantie légale 2 ans et retours 30 jours.`;
    const img = product.image;
    const url = `https://eshop-store.eu/?product=${product.id}`;

    updatePageSEO({
      title,
      description: desc,
      image: img,
      url,
      type: 'product'
    });

    injectProductJsonLd(product, reviews);

    injectBreadcrumbJsonLd([
      { name: 'Accueil', url: '/' },
      { name: product.category || 'Catalogue', url: `/?category=${product.category || 'all'}` },
      { name: product.name, url: `/?product=${product.id}` }
    ]);

    return () => {
      resetSEO();
    };
  }, [product, reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewErrorMsg('');
    setReviewSuccessMsg('');

    if (!reviewForm.authorName.trim() || !reviewForm.comment.trim()) {
      setReviewErrorMsg('Veuillez renseigner votre nom et votre commentaire.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await apiSubmitProductReview(product.id, reviewForm);
      if (res && res.success) {
        setReviewSuccessMsg(res.message || 'Votre avis vérifié a été publié avec succès !');
        if (res.review) {
          setReviews((prev) => [res.review, ...prev]);
        }
        if (res.stats) {
          setReviewStats(res.stats);
        }
        setReviewForm({
          rating: 5,
          authorName: '',
          authorEmail: '',
          orderNumber: '',
          title: '',
          comment: ''
        });
        setTimeout(() => {
          setShowReviewForm(false);
          setReviewSuccessMsg('');
        }, 3000);
      } else {
        setReviewErrorMsg(res?.error || 'Erreur lors de la publication.');
      }
    } catch (err) {
      setReviewErrorMsg('Erreur réseau lors de la publication.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId) => {
    if (votedHelpfulIds.has(reviewId)) return;
    setVotedHelpfulIds((prev) => new Set([...prev, reviewId]));
    try {
      const res = await apiVoteReviewHelpful(reviewId);
      if (res && res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpful_count: res.helpfulCount } : r
          )
        );
      }
    } catch (err) {
      console.warn('Helpful vote error:', err);
    }
  };

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

                {onToggleCompare && (
                  <div className="pdp-compare-action-wrap">
                    <button
                      type="button"
                      className={`pdp-compare-action-btn ${isCompared ? 'active' : ''}`}
                      onClick={() => onToggleCompare(product.id)}
                    >
                      <ArrowLeftRight size={16} />
                      <span>{isCompared ? 'Retirer du comparateur' : 'Ajouter au comparateur'}</span>
                    </button>
                    {isCompared && onOpenCompare && (
                      <button
                        type="button"
                        className="pdp-compare-view-link"
                        onClick={onOpenCompare}
                      >
                        Ouvrir le comparateur ➔
                      </button>
                    )}
                  </div>
                )}
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

              {/* Verified Customer Reviews Section */}
              <div className="pdp-reviews-section" style={{
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Header with aggregate score & action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Avis Clients Vérifiés
                      </h4>
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                        ✓ Normes UE
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                      Authenticité certifiée selon le protocole de commande européenne.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowReviewForm((prev) => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8125rem',
                      borderColor: '#2563eb',
                      color: '#2563eb',
                      background: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    <Edit3 size={14} />
                    <span>{showReviewForm ? 'Fermer le formulaire' : 'Donner mon avis'}</span>
                  </button>
                </div>

                {/* Overall Score & Rating Breakdown Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(110px, 1fr) 2fr',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>
                      {Number(reviewStats.averageRating || 4.8).toFixed(1)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '0.35rem 0' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= Math.round(reviewStats.averageRating || 5) ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Sur {reviewStats.totalReviews} avis
                    </div>
                  </div>

                  {/* Distribution Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {[5, 4, 3, 2, 1].map((starNum) => {
                      const count = reviewStats.distribution?.[starNum] || 0;
                      const pct = reviewStats.totalReviews > 0
                        ? Math.round((count / reviewStats.totalReviews) * 100)
                        : starNum === 5 ? 85 : starNum === 4 ? 15 : 0;
                      return (
                        <div key={starNum} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <span style={{ width: '22px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                            {starNum}★
                          </span>
                          <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ width: '28px', color: '#94a3b8', fontSize: '0.7rem' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Review Submission Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} style={{
                    background: '#ffffff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.75rem' }}>
                      Partager votre retour d'expérience
                    </h5>

                    {/* Star Picker */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                        Votre note globale * :
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              lineHeight: 1
                            }}
                            title={`${s} étoiles sur 5`}
                          >
                            <Star
                              size={24}
                              fill={(hoverRating || reviewForm.rating) >= s ? '#f59e0b' : 'none'}
                              color="#f59e0b"
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, marginLeft: '0.5rem', color: '#f59e0b' }}>
                          {(hoverRating || reviewForm.rating)} / 5
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>
                          Votre Nom ou Prénom * :
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Sophie M."
                          className="form-input"
                          value={reviewForm.authorName}
                          onChange={(e) => setReviewForm({ ...reviewForm, authorName: e.target.value })}
                          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>
                          Adresse Email (non publiée) :
                        </label>
                        <input
                          type="email"
                          placeholder="Ex: sophie@example.com"
                          className="form-input"
                          value={reviewForm.authorEmail}
                          onChange={(e) => setReviewForm({ ...reviewForm, authorEmail: e.target.value })}
                          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>
                          N° Commande (optionnel) :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: EU-184150"
                          className="form-input"
                          value={reviewForm.orderNumber}
                          onChange={(e) => setReviewForm({ ...reviewForm, orderNumber: e.target.value })}
                          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>
                        Titre de votre avis :
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Confort exceptionnel et expédition rapide !"
                        className="form-input"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: '#475569' }}>
                        Votre commentaire détaillé * :
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Décrivez votre expérience d'utilisation, la qualité des finitions..."
                        className="form-input"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', width: '100%' }}
                      />
                    </div>

                    {reviewErrorMsg && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                        <AlertCircle size={14} />
                        <span>{reviewErrorMsg}</span>
                      </div>
                    )}

                    {reviewSuccessMsg && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                        <CheckCircle2 size={14} />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {isSubmittingReview ? (
                          <>
                            <Loader2 size={14} className="spin-icon" />
                            <span>Publication...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Publier mon avis vérifié</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {isLoadingReviews ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
                    <span style={{ fontSize: '0.8125rem' }}>Chargement des avis vérifiés...</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: '10px', color: '#64748b' }}>
                    <MessageSquare size={28} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Soyez le premier client à donner votre avis sur cet article !</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {reviews.map((rev) => {
                      const revDate = rev.created_at
                        ? new Date(rev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Récent';

                      const hasVoted = votedHelpfulIds.has(rev.id);

                      return (
                        <div
                          key={rev.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '10px',
                            padding: '1rem',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* Review Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8125rem'
                              }}>
                                {(rev.author_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{rev.author_name}</strong>
                                  {Boolean(rev.is_verified_buyer) && (
                                    <span style={{ fontSize: '0.6875rem', background: '#ecfdf5', color: '#059669', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                      ✓ Achat vérifié UE
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                                  Avis posté le {revDate}
                                </div>
                              </div>
                            </div>

                            {/* Star Rating */}
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  fill={star <= rev.rating ? '#f59e0b' : 'none'}
                                  color="#f59e0b"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Review Content */}
                          {rev.title && (
                            <h6 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', margin: '0.35rem 0' }}>
                              {rev.title}
                            </h6>
                          )}
                          <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, margin: '0.25rem 0 0.75rem' }}>
                            {rev.comment}
                          </p>

                          {/* Helpful Counter */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleVoteHelpful(rev.id)}
                              disabled={hasVoted}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: hasVoted ? 'default' : 'pointer',
                                fontSize: '0.75rem',
                                color: hasVoted ? '#059669' : '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.2rem 0.4rem',
                                fontWeight: 600
                              }}
                            >
                              <ThumbsUp size={13} color={hasVoted ? '#059669' : '#64748b'} />
                              <span>Utile ({rev.helpful_count || 0})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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

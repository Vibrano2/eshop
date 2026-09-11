import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  Star,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';

export default function ProductCompareModal({
  isOpen,
  onClose,
  compareList = [],
  products = [],
  onAddToCart,
  onRemoveItem,
  onClearAll,
  onOpenDetails
}) {
  const [highlightDiffs, setHighlightDiffs] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const comparedProducts = useMemo(() => {
    return compareList
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  }, [compareList, products]);

  // Gather all unique specification keys across all compared products
  const allSpecKeys = useMemo(() => {
    const keysSet = new Set();
    comparedProducts.forEach((prod) => {
      if (prod.specs && typeof prod.specs === 'object') {
        Object.keys(prod.specs).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [comparedProducts]);

  if (!isOpen) return null;

  // Helper to determine if values in a row differ across products
  const isRowDifferent = (getter) => {
    if (comparedProducts.length < 2) return false;
    const firstVal = getter(comparedProducts[0]);
    return comparedProducts.some((p) => getter(p) !== firstVal);
  };

  const isPriceDifferent = isRowDifferent((p) => p.price);
  const isRatingDifferent = isRowDifferent((p) => p.rating);
  const isStockDifferent = isRowDifferent((p) => p.stock > 0);

  return (
    <div
      className="compare-modal-overlay animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div
        className="compare-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="compare-modal-header">
          <div className="compare-modal-title-group">
            <div className="compare-header-icon-box">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h2 id="compare-modal-title" className="compare-modal-heading">
                Comparateur de produits côte-à-côte
              </h2>
              <p className="compare-modal-subheading">
                Comparez les caractéristiques, tarifs et garanties pour faire le meilleur choix.
              </p>
            </div>
          </div>

          <div className="compare-modal-header-actions">
            {/* Toggle highlight differences */}
            {comparedProducts.length >= 2 && (
              <label className="compare-diff-toggle-label">
                <input
                  type="checkbox"
                  checked={highlightDiffs}
                  onChange={(e) => setHighlightDiffs(e.target.checked)}
                />
                <Sparkles size={14} color={highlightDiffs ? '#ea580c' : '#64748b'} />
                <span>Mettre en évidence les différences</span>
              </label>
            )}

            {/* Clear button */}
            {comparedProducts.length > 0 && (
              <button
                type="button"
                className="compare-header-clear-btn"
                onClick={onClearAll}
                title="Vider le comparateur"
              >
                <Trash2 size={15} />
                <span>Vider tout</span>
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              className="compare-modal-close-btn"
              onClick={onClose}
              aria-label="Fermer le comparateur"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body: Comparison Table or Empty State */}
        <div className="compare-modal-body">
          {comparedProducts.length === 0 ? (
            <div className="compare-empty-state">
              <ArrowLeftRight size={48} className="empty-state-icon" />
              <h3>Votre comparateur est vide</h3>
              <p>Parcourez notre boutique et cliquez sur l'icône de balance sur n'importe quel produit pour le comparer.</p>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Parcourir le catalogue
              </button>
            </div>
          ) : comparedProducts.length === 1 ? (
            <div className="compare-empty-state">
              <ArrowLeftRight size={48} className="empty-state-icon" />
              <h3>Un seul produit sélectionné ({comparedProducts[0].name})</h3>
              <p>Ajoutez au moins un deuxième produit depuis le catalogue pour pouvoir comparer leurs spécificités côte-à-côte.</p>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Ajouter d'autres produits
              </button>
            </div>
          ) : (
            <div className="compare-table-responsive-wrap">
              <table className="compare-matrix-table">
                <thead>
                  <tr>
                    <th className="matrix-label-col matrix-header-cell">
                      <span className="matrix-critere-label">Critères de comparaison</span>
                    </th>
                    {comparedProducts.map((product) => (
                      <th key={product.id} className="matrix-product-col matrix-header-cell">
                        <div className="matrix-product-top-card">
                          <button
                            type="button"
                            className="matrix-remove-btn"
                            onClick={() => onRemoveItem(product.id)}
                            title={`Retirer ${product.name}`}
                            aria-label={`Retirer ${product.name}`}
                          >
                            <X size={14} />
                          </button>

                          <div
                            className="matrix-img-wrap"
                            onClick={() => {
                              onClose();
                              if (onOpenDetails) onOpenDetails(product);
                            }}
                            role="button"
                            tabIndex={0}
                            title="Voir la fiche détaillée"
                          >
                            <img
                              src={product.image}
                              alt={product.altText || product.name}
                              className="matrix-product-img"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                            {product.badge && (
                              <span className="matrix-badge">{product.badge}</span>
                            )}
                          </div>

                          <span className="matrix-category-tag">
                            {product.categoryLabel || product.category}
                          </span>

                          <h4
                            className="matrix-product-title"
                            onClick={() => {
                              onClose();
                              if (onOpenDetails) onOpenDetails(product);
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </h4>

                          <div className="matrix-pricing-box">
                            <span className="matrix-current-price">
                              {product.price.toFixed(2)} €
                            </span>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="matrix-old-price">
                                {product.compareAtPrice.toFixed(2)} €
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary matrix-buy-btn"
                            onClick={() => onAddToCart(product)}
                            title="Ajouter au panier"
                          >
                            <ShoppingBag size={15} />
                            <span>Ajouter</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Row: Note & Avis vérifiés */}
                  <tr className={highlightDiffs && isRatingDifferent ? 'diff-highlight-row' : ''}>
                    <td className="matrix-label-col">
                      <strong>Note & Avis vérifiés</strong>
                      <span className="label-sub">Moyenne clients UE</span>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell">
                        <div className="matrix-rating-row">
                          <Star size={15} fill="#f59e0b" color="#f59e0b" />
                          <span className="rating-num">
                            <strong>{p.rating.toFixed(1)}</strong> / 5
                          </span>
                          <span className="reviews-num">({p.reviewCount} avis)</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Disponibilité & Délais UE */}
                  <tr className={highlightDiffs && isStockDifferent ? 'diff-highlight-row' : ''}>
                    <td className="matrix-label-col">
                      <strong>Disponibilité & Expédition</strong>
                      <span className="label-sub">Entrepôts situés en France & UE</span>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell">
                        <div className="matrix-stock-info">
                          {p.stock && p.stock > 0 ? (
                            <span className="stock-tag-available">
                              <Check size={13} />
                              <span>En stock ({p.stock} ex.)</span>
                            </span>
                          ) : (
                            <span className="stock-tag-out">Rupture temporaire</span>
                          )}
                          <div className="shipping-delay-tag">
                            <Truck size={13} />
                            <span>{p.shippingEU || 'Expédition 2-4 jours UE'}</span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Description & Usage */}
                  <tr>
                    <td className="matrix-label-col">
                      <strong>Description & Utilité</strong>
                      <span className="label-sub">Ce qui rend ce produit unique</span>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell matrix-desc-cell">
                        <p>{p.shortDescription || 'Produit innovant du quotidien sélectionné pour sa fiabilité et sa durabilité.'}</p>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Points forts / Avantages clés */}
                  <tr>
                    <td className="matrix-label-col">
                      <strong>Points forts</strong>
                      <span className="label-sub">Avantages majeurs au quotidien</span>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell">
                        {p.benefits && p.benefits.length > 0 ? (
                          <ul className="matrix-benefits-list">
                            {p.benefits.map((b, idx) => (
                              <li key={idx}>
                                <Check size={13} className="benefit-check-icon" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="matrix-dash">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Dynamic Rows: Specs Keys */}
                  {allSpecKeys.map((key) => {
                    const isDiff = isRowDifferent((p) => p.specs?.[key] || '—');
                    return (
                      <tr
                        key={key}
                        className={highlightDiffs && isDiff ? 'diff-highlight-row' : ''}
                      >
                        <td className="matrix-label-col">
                          <strong>{key}</strong>
                        </td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="matrix-data-cell">
                            {p.specs && p.specs[key] ? (
                              <span className="spec-val">{p.specs[key]}</span>
                            ) : (
                              <span className="matrix-dash">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Row: Variantes / Tailles */}
                  <tr>
                    <td className="matrix-label-col">
                      <strong>Tailles & Variantes</strong>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell">
                        {p.sizes && p.sizes.length > 0 ? (
                          <div className="matrix-sizes-wrap">
                            {p.sizes.map((s) => (
                              <span key={s} className="matrix-size-pill">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : p.colors && p.colors.length > 0 ? (
                          <div className="matrix-colors-wrap">
                            {p.colors.map((c) => (
                              <span
                                key={c.name}
                                className="matrix-color-dot"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="matrix-dash">Taille / Modèle unique</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Garanties & Retours UE */}
                  <tr>
                    <td className="matrix-label-col">
                      <strong>Garanties & Engagements</strong>
                      <span className="label-sub">Conformité légale européenne</span>
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="matrix-data-cell">
                        <div className="matrix-guarantees-col">
                          <div className="guarantee-item">
                            <ShieldCheck size={14} color="#10b981" />
                            <span>Garantie légale 2 ans UE</span>
                          </div>
                          <div className="guarantee-item">
                            <RotateCcw size={14} color="#2563eb" />
                            <span>30 jours satisfait ou remboursé</span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Bottom Action Row */}
                  <tr className="matrix-bottom-action-row">
                    <td className="matrix-label-col matrix-bottom-label">
                      <span>Action rapide</span>
                    </td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="matrix-data-cell">
                        <button
                          type="button"
                          className="btn btn-primary matrix-buy-btn"
                          style={{ width: '100%' }}
                          onClick={() => onAddToCart(product)}
                        >
                          <ShoppingBag size={15} />
                          <span>Ajouter {product.price.toFixed(2)} €</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

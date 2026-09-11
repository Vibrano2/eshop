import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, X, ChevronDown, ChevronUp, Sparkles, Trash2 } from 'lucide-react';

const MAX_COMPARE_ITEMS = 4;

export default function CompareFloatingBar({
  compareList = [],
  products = [],
  onOpenCompare,
  onRemoveItem,
  onClearAll
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Map compared product IDs to product objects
  const comparedProducts = useMemo(() => {
    return compareList
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  }, [compareList, products]);

  if (comparedProducts.length === 0) {
    return null;
  }

  const emptySlotsCount = Math.max(0, MAX_COMPARE_ITEMS - comparedProducts.length);
  const canCompare = comparedProducts.length >= 2;

  // Render minimized floating pill
  if (isMinimized) {
    return (
      <aside aria-label="Comparateur de produits minimisé" className="compare-minimized-pill-wrap">
        <button
          type="button"
          className="compare-minimized-pill"
          onClick={() => setIsMinimized(false)}
          title="Agrandir la barre de comparaison"
          aria-expanded={false}
        >
          <ArrowLeftRight size={16} className="pill-icon" />
          <span className="pill-text">Comparateur</span>
          <span className="pill-badge">{comparedProducts.length}/{MAX_COMPARE_ITEMS}</span>
          <ChevronUp size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Barre de comparaison de produits" className="compare-floating-bar-wrap animate-slide-up">
      <div className="container">
        <div className="compare-floating-bar">
          {/* Header / Info Column */}
          <div className="compare-bar-header">
            <div className="compare-title-row">
              <div className="compare-badge-icon">
                <ArrowLeftRight size={17} />
              </div>
              <div>
                <h4 className="compare-bar-title">Comparateur de produits</h4>
                <p className="compare-bar-sub">
                  {comparedProducts.length < 2
                    ? 'Ajoutez encore 1 article pour comparer'
                    : `${comparedProducts.length} articles prêts à être comparés`}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="compare-toggle-min-btn"
              onClick={() => setIsMinimized(true)}
              title="Réduire temporairement la barre"
              aria-label="Réduire le comparateur"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Thumbnails Slots */}
          <div className="compare-slots-row">
            {comparedProducts.map((product) => (
              <div key={product.id} className="compare-slot filled">
                <img
                  src={product.image}
                  alt={product.altText || product.name}
                  className="compare-slot-thumb"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="compare-slot-info">
                  <span className="compare-slot-name" title={product.name}>
                    {product.name}
                  </span>
                  <span className="compare-slot-price">{product.price.toFixed(2)} €</span>
                </div>
                <button
                  type="button"
                  className="compare-slot-remove"
                  onClick={() => onRemoveItem(product.id)}
                  title={`Retirer ${product.name} du comparateur`}
                  aria-label={`Retirer ${product.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {/* Empty placeholders */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div key={`empty-${idx}`} className="compare-slot empty">
                <span className="empty-plus">+</span>
                <span className="empty-text">Article {comparedProducts.length + idx + 1}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="compare-bar-actions">
            <button
              type="button"
              className={`btn compare-submit-btn ${canCompare ? 'btn-primary' : 'disabled'}`}
              onClick={() => {
                if (canCompare) {
                  onOpenCompare();
                }
              }}
              disabled={!canCompare}
              title={canCompare ? 'Ouvrir le comparateur complet' : 'Sélectionnez au moins 2 articles'}
            >
              <ArrowLeftRight size={16} />
              <span>
                Comparer {comparedProducts.length}/{MAX_COMPARE_ITEMS}
              </span>
            </button>

            <button
              type="button"
              className="compare-clear-btn"
              onClick={onClearAll}
              title="Vider la sélection du comparateur"
            >
              <Trash2 size={14} />
              <span>Vider</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

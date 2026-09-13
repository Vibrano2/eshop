import React from 'react';
import { ArrowRight, Star, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HeroBanner({ onExploreProducts, onExploreNewArrivals, onSelectProduct }) {
  return (
    <section className="hero-section-modern">
      <div className="container">
        <div className="hero-grid-modern">
          {/* Left Column: Typography, Copy, CTAs, Trust */}
          <div className="hero-content-modern">
            <div className="hero-tag-modern">
              <Sparkles size={14} color="#ea580c" />
              <span>Sélection exclusive 2026 — Expédition depuis l'Union Européenne</span>
            </div>

            <h1 className="hero-title-modern">
              Des produits pratiques, intelligents et tendance pour simplifier votre quotidien.
            </h1>

            <p className="hero-description-modern">
              Une sélection soignée d'objets astucieux pour la maison, la tech, la beauté et les déplacements. Moins de superflu, plus d'utilité au meilleur prix.
            </p>

            <div className="hero-actions-modern">
              <button
                className="btn btn-primary hero-btn-main"
                onClick={onExploreProducts}
              >
                <span>Découvrir la sélection</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="btn btn-secondary hero-btn-sub"
                onClick={onExploreNewArrivals}
              >
                <span>Voir les nouveautés</span>
              </button>
            </div>

            <div className="hero-trust-indicators">
              <div className="hero-trust-item">
                <span className="hero-trust-rating">★ 4.9 / 5</span>
                <span className="hero-trust-label">+1 400 avis vérifiés</span>
              </div>
              <div className="hero-trust-divider" />
              <div className="hero-trust-item">
                <ShieldCheck size={16} color="#10b981" />
                <span className="hero-trust-label">Livraison 2-4j & Retours 14j</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with High Quality Featured Scene */}
          <div className="hero-visual-container">
            <div className="hero-featured-card">
              <div className="hero-image-wrap">
                <img
                  src="/products/batterie-externe-compacte-10000-hero-v2.jpg"
                  alt="Batterie externe magnétique sans fil 10000mAh"
                  className="hero-main-img"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = '/products/batterie-externe-compacte-10000-hero-v2.jpg';
                  }}
                />
                <span className="hero-featured-badge">Bestseller Tech</span>
              </div>

              <div className="hero-card-floating-bar">
                <div className="floating-bar-info">
                  <div className="floating-bar-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                    ))}
                    <span className="floating-score">4.9</span>
                  </div>
                  <span className="floating-title">Batterie externe magnétique sans fil</span>
                  <span className="floating-price">29,90 € • En stock UE</span>
                </div>

                <button
                  className="btn btn-sm btn-primary floating-cta"
                  onClick={() => onSelectProduct('batterie-externe-compacte-10000')}
                  aria-label="Voir la batterie externe magnétique"
                >
                  Voir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

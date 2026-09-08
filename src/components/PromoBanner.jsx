import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function PromoBanner({
  badge = 'Sélection exclusive',
  title,
  description,
  ctaText = 'Découvrir',
  image,
  onAction,
  reverse = false
}) {
  return (
    <section className="promo-banner-section">
      <div className="container">
        <div className={`promo-banner-card ${reverse ? 'reverse' : ''}`}>
          <div className="promo-banner-content">
            {badge && (
              <div className="promo-banner-badge">
                <Sparkles size={13} color="#f97316" />
                <span>{badge}</span>
              </div>
            )}
            <h2 className="promo-banner-title">{title}</h2>
            {description && <p className="promo-banner-desc">{description}</p>}
            <div>
              <button className="btn btn-primary" onClick={onAction}>
                <span>{ctaText}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="promo-banner-visual">
            <img
              src={image}
              alt={title}
              className="promo-banner-img"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

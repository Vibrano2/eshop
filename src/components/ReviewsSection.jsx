import React from 'react';
import { Star, CheckCircle, ShieldCheck } from 'lucide-react';
import { TESTIMONIALS } from '../data/testimonials';

export default function ReviewsSection() {
  return (
    <section className="reviews-section">
      <div className="container">
        <div className="section-header-centered">
          <div className="reviews-badge-trust">
            <ShieldCheck size={16} color="#10b981" />
            <span>Avis vérifiés selon les normes de l'Union Européenne</span>
          </div>
          <h2 className="section-title-modern">Ce que nos clients disent de nous</h2>
          <p className="section-subtitle-modern">
            Note moyenne de <strong>4.8 / 5</strong> basée sur plus de 1 400 commandes livrées.
          </p>
        </div>

        <div className="reviews-grid-modern">
          {TESTIMONIALS.slice(0, 3).map((rev) => (
            <div key={rev.id} className="review-card-modern">
              <div className="review-card-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < rev.rating ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
              </div>

              <blockquote className="review-card-quote">
                « {rev.text.length > 140 ? `${rev.text.substring(0, 137)}...` : rev.text} »
              </blockquote>

              <div className="review-card-footer">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="review-card-avatar"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80';
                  }}
                />
                <div className="review-card-meta">
                  <div className="review-card-author">{rev.name}</div>
                  <div className="review-card-badge">
                    <CheckCircle size={12} />
                    <span>Achat vérifié • {rev.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

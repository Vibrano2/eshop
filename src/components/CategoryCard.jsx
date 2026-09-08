import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CategoryCard({ category, onSelect }) {
  return (
    <div
      className="category-card-modern"
      onClick={() => onSelect(category.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(category.id);
        }
      }}
    >
      <div className="category-card-image-wrapper">
        <img
          src={category.image}
          alt={category.name}
          className="category-card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="category-card-overlay" />
      </div>

      <div className="category-card-info">
        <div className="category-card-header">
          <h3 className="category-card-title">{category.name}</h3>
          <span className="category-card-count">{category.itemCount}</span>
        </div>

        <div className="category-card-cta">
          <span>Découvrir</span>
          <ArrowRight size={14} className="category-card-arrow" />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({ title, subtitle, actionText = 'Voir tout', onAction }) {
  return (
    <div className="section-header-modern">
      <div className="section-header-text">
        <h2 className="section-title-modern">{title}</h2>
        {subtitle && <p className="section-subtitle-modern">{subtitle}</p>}
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="section-action-link"
          title={`${actionText} - ${title}`}
        >
          <span>{actionText}</span>
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

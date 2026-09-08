import React from 'react';
import { X, ShieldCheck, Truck, CheckCircle2, Award, HeartHandshake, MapPin, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function AboutModal({ isOpen, onClose, lang = 'fr', onOpenShop, onOpenReassurance }) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang]?.about || TRANSLATIONS.fr.about;

  return (
    <div className="modal-backdrop-fade" onClick={onClose} role="dialog" aria-modal="true">
      <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="about-modal-header">
          <div className="about-header-branding">
            <span className="eu-flag-pill">🇪🇺 Marché Européen</span>
            <h2 className="about-modal-title">{t.title}</h2>
            <p className="about-modal-subtitle">{t.subtitle}</p>
          </div>
          <button className="about-close-btn" onClick={onClose} aria-label={t.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="about-modal-body">
          {/* Mission Card */}
          <div className="about-mission-box">
            <div className="mission-icon-wrap">
              <Sparkles size={24} className="accent-sparkle" />
            </div>
            <div>
              <h3 className="mission-box-title">{t.ourMission}</h3>
              <p className="mission-box-text">{t.missionDesc}</p>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="about-pillars-section">
            <h3 className="about-section-heading">{t.pillarsTitle}</h3>
            <div className="about-pillars-grid">
              {/* Pillar 1 */}
              <div className="about-pillar-card">
                <div className="pillar-icon-badge bg-blue">
                  <MapPin size={22} color="#2563eb" />
                </div>
                <h4 className="pillar-card-title">{t.pillar1Title}</h4>
                <p className="pillar-card-desc">{t.pillar1Desc}</p>
              </div>

              {/* Pillar 2 */}
              <div className="about-pillar-card">
                <div className="pillar-icon-badge bg-amber">
                  <Award size={22} color="#d97706" />
                </div>
                <h4 className="pillar-card-title">{t.pillar2Title}</h4>
                <p className="pillar-card-desc">{t.pillar2Desc}</p>
              </div>

              {/* Pillar 3 */}
              <div className="about-pillar-card">
                <div className="pillar-icon-badge bg-emerald">
                  <ShieldCheck size={22} color="#059669" />
                </div>
                <h4 className="pillar-card-title">{t.pillar3Title}</h4>
                <p className="pillar-card-desc">{t.pillar3Desc}</p>
              </div>

              {/* Pillar 4 */}
              <div className="about-pillar-card">
                <div className="pillar-icon-badge bg-purple">
                  <HeartHandshake size={22} color="#7c3aed" />
                </div>
                <h4 className="pillar-card-title">{t.pillar4Title}</h4>
                <p className="pillar-card-desc">{t.pillar4Desc}</p>
              </div>
            </div>
          </div>

          {/* Key Numbers / Stats */}
          <div className="about-stats-bar">
            <div className="about-stat-item">
              <span className="stat-number">110+</span>
              <span className="stat-label">Produits rigoureusement testés</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat-item">
              <span className="stat-number">2-5 j</span>
              <span className="stat-label">Délai moyen de livraison UE</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat-item">
              <span className="stat-number">14 jours</span>
              <span className="stat-label">Rétractation sans justification</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat-item">
              <span className="stat-number">2 ans</span>
              <span className="stat-label">Garantie légale européenne</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="about-modal-footer">
          <button
            className="about-reassurance-btn"
            onClick={() => {
              onClose();
              if (onOpenReassurance) onOpenReassurance();
            }}
          >
            <ShieldCheck size={16} />
            <span>Voir nos garanties juridiques UE</span>
          </button>
          <button
            className="about-primary-btn"
            onClick={() => {
              onClose();
              if (onOpenShop) onOpenShop('all');
            }}
          >
            <Truck size={16} />
            <span>Explorer notre catalogue</span>
          </button>
        </div>
      </div>
    </div>
  );
}

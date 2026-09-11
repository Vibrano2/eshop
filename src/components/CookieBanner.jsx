import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings, Check, X, Info, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'eshop_cookie_consent';

export default function CookieBanner({ onOpenPrivacyPolicy }) {
  const [hasConsented, setHasConsented] = useState(true); // default true to avoid flash
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true & required
    analytics: true,
    marketing: true
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setHasConsented(false);
      } else {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setPreferences({
            essential: true,
            analytics: Boolean(parsed.analytics),
            marketing: Boolean(parsed.marketing)
          });
        }
      }
    } catch {
      setHasConsented(false);
    }

    // Listen for custom event from footer link "Gestion des cookies"
    const handleOpenPreferences = () => {
      setShowPreferences(true);
    };
    window.addEventListener('eshop:open-cookie-preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('eshop:open-cookie-preferences', handleOpenPreferences);
    };
  }, []);

  const saveConsent = (prefs) => {
    const payload = {
      essential: true,
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing),
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Cookie consent localStorage error:', e);
    }
    setPreferences(payload);
    setHasConsented(true);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  };

  const handleDeclineAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  // If already consented and modal not opened, render nothing
  if (hasConsented && !showPreferences) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING BOTTOM BANNER (When no choice made yet) */}
      {!hasConsented && !showPreferences && (
        <aside
          role="region"
          aria-label="Consentement aux cookies et respect de la vie privée"
          className="cookie-consent-banner"
        >
          <div className="cookie-banner-container">
            <div className="cookie-banner-content">
              <div className="cookie-banner-icon-wrap">
                <Cookie size={24} className="cookie-banner-icon" />
              </div>
              <div className="cookie-banner-text">
                <h4 className="cookie-banner-title">
                  Respect de votre vie privée & Cookies UE
                </h4>
                <p className="cookie-banner-desc">
                  Conformément au <strong>RGPD</strong> et à la directive européenne ePrivacy, nous utilisons des cookies pour sécuriser votre navigation, mesurer anonymement l'audience et personnaliser nos services. Vous pouvez personnaliser vos choix ou retirer votre consentement à tout instant.
                </p>
                <div className="cookie-banner-links">
                  {onOpenPrivacyPolicy && (
                    <button
                      type="button"
                      onClick={onOpenPrivacyPolicy}
                      className="cookie-banner-link-btn"
                    >
                      <Info size={13} />
                      <span>Lire notre Politique de Confidentialité</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="cookie-banner-actions">
              <button
                type="button"
                onClick={handleDeclineAll}
                className="cookie-btn cookie-btn-refuse"
                title="Continuer sans accepter les cookies non essentiels"
              >
                Continuer sans accepter
              </button>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="cookie-btn cookie-btn-customize"
                title="Personnaliser mes choix par finalité"
              >
                <Settings size={15} />
                <span>Personnaliser</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="cookie-btn cookie-btn-accept"
                title="Accepter tous les cookies"
              >
                <Check size={16} />
                <span>Tout accepter</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. PRIVACY & COOKIE PREFERENCES MODAL */}
      {showPreferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Centre de préférences de confidentialité"
          className="modal-backdrop"
          onClick={() => {
            if (hasConsented) setShowPreferences(false);
          }}
        >
          <div
            className="cookie-preferences-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cookie-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="cookie-modal-icon-badge">
                  <ShieldCheck size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 className="cookie-modal-title">
                    Centre de Préférences de Confidentialité
                  </h3>
                  <span className="cookie-modal-subtitle">
                    Conformité européenne RGPD 2016/679
                  </span>
                </div>
              </div>
              {hasConsented && (
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="modal-close-btn"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="cookie-modal-body">
              <p className="cookie-modal-intro">
                Nous accordons une importance primordiale à la protection de vos données personnelles. Vous pouvez ajuster ci-dessous vos préférences pour chaque finalité de traceur.
              </p>

              <div className="cookie-categories-list">
                {/* Category 1: Essential (Required) */}
                <div className="cookie-category-card">
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <div className="cookie-category-title-row">
                        <strong className="cookie-category-name">Cookies Essentiels & Techniques</strong>
                        <span className="cookie-badge-required">Toujours Actifs</span>
                      </div>
                      <p className="cookie-category-desc">
                        Indispensables au fonctionnement du site : maintien du panier d'achat, connexion sécurisée à votre compte client, mémorisation de votre devise (€) et sécurité des transactions PCI-DSS.
                      </p>
                    </div>
                    <div className="cookie-toggle-wrap">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        aria-label="Cookies essentiels activés par défaut"
                        className="cookie-switch-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Category 2: Analytics / Audience */}
                <div className="cookie-category-card">
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <div className="cookie-category-title-row">
                        <strong className="cookie-category-name">Mesure d'Audience & Performance</strong>
                        <span className="cookie-badge-optional">Optionnel</span>
                      </div>
                      <p className="cookie-category-desc">
                        Permettent d'analyser de manière totalement anonymisée la fréquentation et l'ergonomie des pages afin d'améliorer en permanence la fluidité et les temps de chargement.
                      </p>
                    </div>
                    <label className="cookie-toggle-wrap" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="cookie-switch-input"
                        aria-label="Activer ou désactiver les cookies d'analyse"
                      />
                      <span className="cookie-switch-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Category 3: Personalization / Marketing */}
                <div className="cookie-category-card">
                  <div className="cookie-category-header">
                    <div className="cookie-category-info">
                      <div className="cookie-category-title-row">
                        <strong className="cookie-category-name">Personnalisation & Expérience</strong>
                        <span className="cookie-badge-optional">Optionnel</span>
                      </div>
                      <p className="cookie-category-desc">
                        Mémorisent vos préférences de filtres, les produits consultés récemment et permettent d'afficher des suggestions adaptées à vos besoins réels. Zéro revente de vos données.
                      </p>
                    </div>
                    <label className="cookie-toggle-wrap" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="cookie-switch-input"
                        aria-label="Activer ou désactiver les cookies de personnalisation"
                      />
                      <span className="cookie-switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="cookie-modal-footer">
              <div className="cookie-modal-footer-left">
                {onOpenPrivacyPolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreferences(false);
                      onOpenPrivacyPolicy();
                    }}
                    className="cookie-banner-link-btn"
                  >
                    <ExternalLink size={13} />
                    <span>Consulter la Politique de Confidentialité</span>
                  </button>
                )}
              </div>
              <div className="cookie-modal-footer-right">
                <button
                  type="button"
                  onClick={handleDeclineAll}
                  className="btn btn-outline btn-sm"
                >
                  Tout refuser
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="btn btn-secondary btn-sm"
                >
                  Enregistrer mes choix
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="btn btn-primary btn-sm"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

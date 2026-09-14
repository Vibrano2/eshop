import React from 'react';
import { Truck, ShieldCheck, Lock, Globe } from 'lucide-react';

export default function Footer({ onOpenLegal, onOpenTracking, onSelectCategory, onOpenAbout, lang = 'fr' }) {
  return (
    <footer className="site-footer-modern" aria-label="Pied de page">
      <div className="container">
        {/* Main 4 Columns Structure */}
        <div className="footer-columns-grid">
          {/* Col 1: À propos */}
          <div className="footer-column">
            <h3 className="footer-column-title">{lang === 'de' ? 'Über uns' : lang === 'en' ? 'About Us' : 'À propos'}</h3>
            <ul className="footer-column-links">
              <li>
                <button onClick={onOpenAbout || (() => onOpenLegal('mentions'))}>
                  {lang === 'de' ? 'Unsere Geschichte' : lang === 'en' ? 'Our Story' : 'Notre histoire'}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('mentions')}>Contactez-nous</button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('mentions')}>Le Blog & Guides</button>
              </li>
              <li>
                <span className="footer-note-text">
                  Boutique européenne dédiée aux produits utiles du quotidien.
                </span>
              </li>
            </ul>
          </div>

          {/* Col 2: Aide */}
          <div className="footer-column">
            <h3 className="footer-column-title">Aide</h3>
            <ul className="footer-column-links">
              <li>
                <button onClick={() => onOpenLegal('cgv')}>Foire Aux Questions (FAQ)</button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('cgv')}>Modalités de Livraison</button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('retractation')}>Retours & Rétractation (14j)</button>
              </li>
              <li>
                <button onClick={onOpenTracking}>Suivi de commande</button>
              </li>
            </ul>
          </div>

          {/* Col 3: Informations */}
          <div className="footer-column">
            <h3 className="footer-column-title">Informations</h3>
            <ul className="footer-column-links">
              <li>
                <button onClick={() => onOpenLegal('cgv')}>Conditions Générales (CGV)</button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('rgpd')}>Politique de confidentialité</button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('eshop:open-cookie-preferences'));
                  }}
                >
                  Gestion des cookies
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('mentions')}>Mentions légales</button>
              </li>
            </ul>
          </div>

          {/* Col 4: Rayons & Catégories */}
          <div className="footer-column">
            <h3 className="footer-column-title">Rayons</h3>
            <ul className="footer-column-links">
              <li>
                <button onClick={() => onSelectCategory('mode')}>Mode & Tendances</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('beaute')}>Beauté & Bien-être</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('technologie')}>Technologie & Gadgets</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('maison')}>Maison & Cuisine</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('animaux')}>Animaux</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('sport')}>Sport & Fitness</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('auto')}>Auto & Accessoires</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('securite')}>Sécurité & Caméras</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('voyage')}>Voyage & Bagagerie</button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('accessoires')}>Accessoires</button>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Divider */}
        <div className="footer-divider-line" />

        {/* Footer Bottom Bar: Badges, Payment Icons, Copyright */}
        <div className="footer-bottom-flex">
          <div className="footer-legal-copy">
            <div className="footer-brand-mini">
              <img
                src="/logo.svg"
                alt="EshopStore"
                style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px', verticalAlign: 'middle', marginRight: '6px' }}
              />
              <span>EshopStore</span>
            </div>
            <p className="copyright-text">
              © {new Date().getFullYear()} eshopstore.shop. Tous droits réservés. Vente en ligne conforme aux directives de l'Union Européenne (RGPD, droit de rétractation 14j, garantie légale 2 ans).
            </p>
          </div>

          {/* Payment Icons */}
          <div className="footer-payments-wrap">
            <span className="payment-badge-pill">CB</span>
            <span className="payment-badge-pill">VISA</span>
            <span className="payment-badge-pill">MASTERCARD</span>
            <span className="payment-badge-pill">STRIPE</span>
            <span className="payment-badge-pill">APPLE PAY</span>
            <span className="payment-badge-pill">GOOGLE PAY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

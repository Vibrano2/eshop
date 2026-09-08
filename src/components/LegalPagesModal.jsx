import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RotateCcw, Building2 } from 'lucide-react';

export default function LegalPagesModal({ isOpen, onClose, initialTab = 'cgv' }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-detail-modal" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="modal-scroll-content">
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button
              className={`category-tab ${activeTab === 'cgv' ? 'active' : ''}`}
              onClick={() => setActiveTab('cgv')}
            >
              <FileText size={14} />
              <span>CGV</span>
            </button>
            <button
              className={`category-tab ${activeTab === 'retractation' ? 'active' : ''}`}
              onClick={() => setActiveTab('retractation')}
            >
              <RotateCcw size={14} />
              <span>Droit de Rétractation (14j UE)</span>
            </button>
            <button
              className={`category-tab ${activeTab === 'rgpd' ? 'active' : ''}`}
              onClick={() => setActiveTab('rgpd')}
            >
              <ShieldCheck size={14} />
              <span>Politique RGPD</span>
            </button>
            <button
              className={`category-tab ${activeTab === 'mentions' ? 'active' : ''}`}
              onClick={() => setActiveTab('mentions')}
            >
              <Building2 size={14} />
              <span>Mentions Légales</span>
            </button>
          </div>

          {/* TAB 1: CGV */}
          {activeTab === 'cgv' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Conditions Générales de Vente (CGV)
              </h3>
              <p><strong>1. Champ d'application</strong> : Les présentes CGV s'appliquent à toutes les commandes passées sur la boutique en ligne eshop-store.eu desservant les pays de l'Union Européenne.</p>
              <p style={{ marginTop: '0.75rem' }}><strong>2. Prix et Devises</strong> : Tous les prix affichés sont en Euros (€) Toutes Taxes Comprises (TTC). Les frais de livraison sont offerts dès 40 € de commande.</p>
              <p style={{ marginTop: '0.75rem' }}><strong>3. Livraison et Délais</strong> : Nos colis sont expédiés en priorité depuis des centres logistiques situés dans l'UE (délais moyens constatés : 2 à 5 jours ouvrés). Un numéro de suivi vous est automatiquement communiqué dès expédition.</p>
              <p style={{ marginTop: '0.75rem' }}><strong>4. Garantie Légale de Conformité</strong> : Conformément à la législation européenne, tous nos produits bénéficient de la garantie légale de conformité de 2 ans.</p>
            </div>
          )}

          {/* TAB 2: RETRACTATION */}
          {activeTab === 'retractation' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Droit de Rétractation de 14 Jours (Directive Européenne)
              </h3>
              <p>Conformément à la directive européenne 2011/83/UE, vous disposez d'un délai légal de <strong>14 jours francs</strong> à compter de la réception de votre colis pour exercer votre droit de rétractation sans avoir à motiver votre décision.</p>
              
              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', margin: '1.25rem 0' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Modèle de formulaire de rétractation :</h4>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                  À l'attention du Service Client eshop-store.eu (support@eshop-store.eu) :<br />
                  Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :<br />
                  - Numéro de commande : [EU-XXXXXX]<br />
                  - Reçue le : [Date]<br />
                  - Nom du consommateur : [Votre nom]<br />
                  - Adresse : [Votre adresse]
                </p>
              </div>
              <p>Le remboursement intégral est opéré sous 14 jours suivant la notification ou la réception du retour.</p>
            </div>
          )}

          {/* TAB 3: RGPD */}
          {activeTab === 'rgpd' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Protection des Données Personnelles (RGPD)
              </h3>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD 2016/679), vos données ne sont collectées que pour le strict traitement et le suivi de votre commande.</p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                <li>Aucune donnée bancaire n'est stockée sur nos serveurs (cryptage direct via prestataire agréé PCI-DSS).</li>
                <li>Droit d'accès, de rectification et d'effacement de vos données sur simple demande par email.</li>
                <li>Zéro revente de vos informations à des tiers annonceurs.</li>
              </ul>
            </div>
          )}

          {/* TAB 4: MENTIONS LEGALES */}
          {activeTab === 'mentions' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Mentions Légales
              </h3>
              <p><strong>Éditeur du site :</strong> eshop-store.eu<br />
              <strong>Contact client :</strong> support@eshop-store.eu (réponse 7j/7 sous 24h)<br />
              <strong>Hébergement :</strong> Infrastructure Cloud Européenne conforme aux normes de sécurité et au RGPD.<br />
              <strong>Règlement des litiges :</strong> Plateforme de règlement en ligne des litiges de la Commission Européenne : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>ec.europa.eu/consumers/odr</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

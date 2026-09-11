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
              <p><strong>1. Champ d'application</strong> : Les présentes CGV s'appliquent à toutes les commandes passées sur la boutique en ligne eshopstore.shop desservant les pays de l'Union Européenne.</p>
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
                  À l'attention du Service Client eshopstore.shop (support@eshopstore.shop) :<br />
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

          {/* TAB 3: RGPD & POLITIQUE DE CONFIDENTIALITÉ */}
          {activeTab === 'rgpd' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Politique de Confidentialité & Protection des Données (RGPD)
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                Dernière mise à jour : Conforme au Règlement Européen (UE) 2016/679 (RGPD) et à la directive ePrivacy.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    1. Responsable du Traitement des Données
                  </h4>
                  <p>
                    Le traitement de vos données personnelles est effectué sous la responsabilité de <strong>eshopstore.shop</strong>. Vos données sont hébergées au sein de l'Union Européenne et ne font l'objet d'aucun transfert non sécurisé hors de l'UE.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    2. Données Collectées & Finalités du Traitement
                  </h4>
                  <p>Nous ne collectons que les informations strictement indispensables à votre expérience d'achat :</p>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
                    <li><strong>Traitement et expédition des commandes :</strong> Nom, prénom, adresse postale de livraison et de facturation, email et numéro de téléphone pour le suivi de colis (Colissimo / DHL).</li>
                    <li><strong>Facturation et comptabilité :</strong> Édition de factures conformes à la directive TVA européenne (conservation légale obligatoire).</li>
                    <li><strong>Service client et SAV :</strong> Historique de commande, demandes de retour (RMA) et échanges sécurisés.</li>
                    <li><strong>Avis vérifiés :</strong> Prénom ou pseudonyme et photos réelles fournies volontairement pour l'évaluation des produits.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    3. Sécurité des Paiements & Norme PCI-DSS
                  </h4>
                  <p>
                    <strong>Aucune donnée de carte bancaire n'est jamais enregistrée ni consultée par nos serveurs.</strong> Les transactions sont déléguées directement à des prestataires de paiement certifiés <strong>PCI-DSS Niveau 1</strong> via un canal chiffré de bout en bout (protocole TLS 1.3 avec authentification forte 3-D Secure).
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    4. Vos Droits d'Accès, de Rectification et d'Effacement
                  </h4>
                  <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
                    <li><strong>Droit d'accès et de portabilité :</strong> Téléchargement de vos données et factures depuis votre Espace Client.</li>
                    <li><strong>Droit de rectification :</strong> Modification immédiate de vos adresses et coordonnées.</li>
                    <li><strong>Droit à l'effacement (« droit à l'oubli ») :</strong> Suppression de votre compte et anonymisation de vos données sur simple demande à <em>privacy@eshopstore.shop</em> (sous réserve des délais légaux de conservation comptable).</li>
                    <li><strong>Droit d'opposition et de retrait du consentement :</strong> Gestion de vos préférences cookies à tout moment via le lien « Gestion des cookies » en pied de page.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    5. Durée de Conservation des Données
                  </h4>
                  <p>
                    Vos données de compte actif sont conservées tant que votre compte reste ouvert. En cas d'inactivité prolongée de plus de 3 ans, votre compte est archivé puis supprimé. Les pièces comptables et factures sont conservées 10 ans en conformité avec le code de commerce européen.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    6. Réclamation auprès de l'Autorité de Contrôle
                  </h4>
                  <p>
                    Pour toute question relative à vos données, contactez notre Délégué à la Protection des Données à <strong>dpo@eshopstore.shop</strong>. Vous disposez également du droit d'introduire une réclamation auprès de l'autorité de contrôle compétente (CNIL en France ou autorité locale de votre État membre de l'UE).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MENTIONS LEGALES */}
          {activeTab === 'mentions' && (
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Mentions Légales
              </h3>
              <p><strong>Éditeur du site :</strong> eshopstore.shop<br />
              <strong>Contact client :</strong> support@eshopstore.shop (réponse 7j/7 sous 24h)<br />
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

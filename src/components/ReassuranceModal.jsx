import React from 'react';
import {
  X,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';

export default function ReassuranceModal({ isOpen, onClose, onOpenLegal }) {
  if (!isOpen) return null;

  const guarantees = [
    {
      icon: Truck,
      color: '#1e3a8a',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      title: 'Livraison Rapide UE',
      subtitle: '2 à 5 jours ouvrés depuis nos entrepôts en Europe',
      details: [
        'Expédition sous 24h ouvrées depuis nos plateformes (France & Allemagne)',
        'Suivi de colis numéroté en temps réel (Colissimo, DHL Express, DPD)',
        'Livraison offerte dès 40 € d\'achat dans toute l\'Union Européenne',
        'Emballages renforcés et contrôles qualité avant envoi'
      ]
    },
    {
      icon: ShieldCheck,
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      title: 'Paiement 100% Sécurisé',
      subtitle: 'Transactions cryptées SSL 256-bits & 3D Secure v2',
      details: [
        'Cartes bancaires acceptées : Visa, Mastercard, CB',
        'Paiements express 1-clic : Apple Pay, Google Pay et PayPal',
        'Norme bancaire européenne PCI-DSS de niveau 1',
        'Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs'
      ]
    },
    {
      icon: RotateCcw,
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      title: 'Satisfait ou Remboursé (14 Jours)',
      subtitle: 'Droit de rétractation européen garanti sans justification',
      details: [
        '14 jours francs à compter de la réception pour tester vos articles',
        'Procédure de retour simple et rapide via notre service client',
        'Remboursement intégral effectué sous 14 jours par le moyen de paiement initial',
        'Garantie légale de conformité européenne de 2 ans sur tous les produits'
      ]
    },
    {
      icon: Headphones,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      title: 'Service Client Dédié & Réactif',
      subtitle: 'Équipe basée en Europe disponible 7j/7',
      details: [
        'Assistance 100% en français, allemand et anglais',
        'Réponse garantie en moins de 24h ouvrées',
        'Contact direct par email : support@eshopstore.shop',
        'Aide au suivi de commande, échanges et conseils personnalisés'
      ]
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="product-detail-modal"
        style={{ maxWidth: '750px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="modal-scroll-content">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#eff6ff',
                color: '#1e3a8a',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '0.75rem'
              }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <span>ENGAGEMENTS QUALITÉ & CONFORMITÉ EUROPÉENNE</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              Nos Garanties pour Acheter en Toute Sérénité
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '520px', margin: '0.35rem auto 0' }}>
              Chez <strong>eshopstore.shop</strong>, nous sélectionnons des gadgets innovants avec une logistique et un cadre juridique 100% conformes aux normes de l'Union Européenne.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {guarantees.map((g, idx) => {
              const Icon = g.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid ${g.borderColor}`,
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: g.bgColor,
                        color: g.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                        {g.title}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {g.subtitle}
                      </p>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem', color: '#334155' }}>
                    {g.details.map((detail, dIdx) => (
                      <li key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Footer Call to Action in Modal */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
              Besoin de plus d'informations ? Consultez nos{' '}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLegal) onOpenLegal('retractation');
                }}
                style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'underline' }}
              >
                conditions de rétractation
              </button>{' '}
              ou nos{' '}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLegal) onOpenLegal('cgv');
                }}
                style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'underline' }}
              >
                CGV
              </button>.
            </div>

            <button className="btn btn-primary btn-sm" onClick={onClose}>
              J'ai compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

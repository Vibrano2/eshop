import React from 'react';
import { CheckCircle2, ShieldCheck, Truck, Headphones } from 'lucide-react';

export default function WhyChooseUs({ onOpenReassurance }) {
  const points = [
    {
      icon: CheckCircle2,
      title: 'Produits soigneusement sélectionnés',
      desc: 'Chaque gadget est testé et validé pour son utilité réelle, sa durabilité et sa simplicité au quotidien.'
    },
    {
      icon: ShieldCheck,
      title: 'Paiement sécurisé par Stripe',
      desc: 'Vos paiements sont traités directement par Stripe avec chiffrement de bout en bout et authentification 3D Secure.'
    },
    {
      icon: Truck,
      title: 'Livraison fiable depuis l\'UE',
      desc: 'Nos commandes sont préparées et expédiées rapidement depuis nos centres logistiques européens.'
    },
    {
      icon: Headphones,
      title: 'Service client réactif 7j/7',
      desc: 'Une équipe francophone disponible par email pour répondre à toutes vos questions en moins de 24h.'
    }
  ];

  return (
    <section className="why-choose-section">
      <div className="container">
        <div className="section-header-centered">
          <h2 className="section-title-modern">Pourquoi nous choisir ?</h2>
          <p className="section-subtitle-modern">
            Une expérience d'achat transparente, rapide et sans mauvaise surprise.
          </p>
        </div>

        <div className="why-choose-grid">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div key={idx} className="why-choose-card">
                <div className="why-choose-icon-wrap">
                  <Icon size={24} />
                </div>
                <h3 className="why-choose-card-title">{pt.title}</h3>
                <p className="why-choose-card-desc">{pt.desc}</p>
              </div>
            );
          })}
        </div>

        {onOpenReassurance && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={onOpenReassurance}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', gap: '0.4rem' }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <span>Consulter l'ensemble de nos garanties européennes</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

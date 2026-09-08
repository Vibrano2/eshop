import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export default function ReassuranceBar() {
  const items = [
    {
      icon: Truck,
      title: 'Livraison Rapide UE',
      desc: '2 à 5 jours depuis entrepôts européens'
    },
    {
      icon: ShieldCheck,
      title: 'Paiement 100% Sécurisé',
      desc: 'Cartes, PayPal, Apple Pay & 3D Secure'
    },
    {
      icon: RotateCcw,
      title: 'Satisfait ou Remboursé',
      desc: '14 jours de rétractation conforme UE'
    },
    {
      icon: Headphones,
      title: 'Service Client Dédié',
      desc: 'Assistance en français 7j/7 par email'
    }
  ];

  return (
    <div className="reassurance-bar">
      <div className="container">
        <div className="reassurance-grid">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="reassurance-item">
                <div className="reassurance-icon">
                  <Icon size={20} />
                </div>
                <div className="reassurance-text">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

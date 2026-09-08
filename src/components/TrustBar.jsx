import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export default function TrustBar({ onOpenReassurance, lang = 'fr' }) {
  const itemsByLang = {
    fr: [
      { icon: Truck, title: 'Livraison rapide', subtitle: '2 à 5 jours en Europe' },
      { icon: ShieldCheck, title: 'Paiement sécurisé', subtitle: 'Transactions cryptées SSL' },
      { icon: RotateCcw, title: 'Retours faciles', subtitle: '14 jours satisfait ou remboursé' },
      { icon: Headphones, title: 'Assistance client', subtitle: 'Support réactif 7j/7' }
    ],
    en: [
      { icon: Truck, title: 'Fast EU Delivery', subtitle: '2 to 5 days across Europe' },
      { icon: ShieldCheck, title: '100% Secure Payment', subtitle: 'SSL encrypted transactions' },
      { icon: RotateCcw, title: 'Easy Returns', subtitle: '14-day money-back guarantee' },
      { icon: Headphones, title: 'Customer Support', subtitle: 'Responsive 7/7 assistance' }
    ],
    de: [
      { icon: Truck, title: 'Schnelle EU-Lieferung', subtitle: '2 bis 5 Tage in Europa' },
      { icon: ShieldCheck, title: 'Sichere Bezahlung', subtitle: 'SSL-verschlüsselte Daten' },
      { icon: RotateCcw, title: 'Einfache Rückgabe', subtitle: '14 Tage Geld-zurück-Garantie' },
      { icon: Headphones, title: 'Kundenservice', subtitle: 'Reaktionsschneller 7/7 Support' }
    ]
  };

  const items = itemsByLang[lang] || itemsByLang.fr;

  return (
    <section
      className="trust-bar-compact"
      aria-label="Engagements et réassurance"
      onClick={onOpenReassurance}
      style={{ cursor: onOpenReassurance ? 'pointer' : 'default' }}
      title="Cliquez pour afficher le détail de nos engagements"
    >
      <div className="container">
        <div className="trust-bar-grid">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="trust-bar-item">
                <div className="trust-bar-icon-wrap">
                  <Icon size={18} />
                </div>
                <div className="trust-bar-content">
                  <h3 className="trust-bar-title">{item.title}</h3>
                  <p className="trust-bar-sub">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

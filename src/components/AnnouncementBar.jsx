import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

const MESSAGES = [
  { icon: Truck, text: 'Expédition express sous 24h depuis nos entrepôts UE 🇪🇺' },
  { icon: Sparkles, text: 'Livraison standard OFFERTE dès 40 € d\'achat avec le code BIENVENUE10 (-10%)' },
  { icon: RotateCcw, text: 'Garantie Retours et Rétractation 14 jours simplifiée' }
];

export default function AnnouncementBar({ cartSubtotal = 0, onOpenReassurance, lang = 'fr' }) {
  const [index, setIndex] = useState(0);

  const messagesByLang = {
    fr: [
      { icon: Truck, text: 'Expédition express sous 24/48h depuis nos entrepôts UE 🇪🇺' },
      { icon: Sparkles, text: 'Livraison standard OFFERTE dès 40 € d\'achat avec le code BIENVENUE10 (-10%)' },
      { icon: RotateCcw, text: 'Garantie Retours et Rétractation 14 jours simplifiée' }
    ],
    en: [
      { icon: Truck, text: 'Express dispatch within 24/48h from our EU warehouses 🇪🇺' },
      { icon: Sparkles, text: 'FREE standard shipping over €40 with code BIENVENUE10 (-10%)' },
      { icon: RotateCcw, text: 'Guaranteed 14-day hassle-free returns' }
    ],
    de: [
      { icon: Truck, text: 'Express-Versand innerhalb von 24/48 Std. aus EU-Lagern 🇪🇺' },
      { icon: Sparkles, text: 'KOSTENLOSER Versand ab 40 € mit Code BIENVENUE10 (-10%)' },
      { icon: RotateCcw, text: 'Garantiertes 14-tägiges unkompliziertes Rückgaberecht' }
    ]
  };

  const activeMessages = messagesByLang[lang] || messagesByLang.fr;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeMessages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeMessages.length]);

  const current = activeMessages[index] || activeMessages[0];
  const CurrentIcon = current.icon;
  const remainingForFree = Math.max(0, 40 - cartSubtotal);

  const getSubtotalNotice = () => {
    if (cartSubtotal > 0 && remainingForFree > 0) {
      if (lang === 'de') return <>Noch <strong>{remainingForFree.toFixed(2)} €</strong> für kostenlosen Versand!</>;
      if (lang === 'en') return <>Only <strong>€{remainingForFree.toFixed(2)}</strong> left to get FREE shipping!</>;
      return <>Plus que <strong>{remainingForFree.toFixed(2)} €</strong> pour bénéficier de la livraison offerte !</>;
    }
    if (cartSubtotal >= 40) {
      if (lang === 'de') return <>🎉 Glückwunsch! <strong>Kostenloser EU-Versand</strong> freigeschaltet.</>;
      if (lang === 'en') return <>🎉 Congratulations! Your <strong>EU Shipping is FREE</strong>.</>;
      return <>🎉 Félicitations ! Votre <strong>Livraison est OFFERTE</strong> vers l'UE.</>;
    }
    return current.text;
  };

  return (
    <div
      className="announcement-bar"
      onClick={onOpenReassurance}
      style={{ cursor: onOpenReassurance ? 'pointer' : 'default' }}
      title="Cliquez pour voir nos engagements & garanties UE"
    >
      <span className="announcement-badge">OFFRE UE</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <CurrentIcon size={14} />
        <span>{getSubtotalNotice()}</span>
      </div>
      <span style={{ fontSize: '0.6875rem', textDecoration: 'underline', opacity: 0.8, marginLeft: '0.25rem' }}>
        ({lang === 'de' ? 'Garantien ➔' : lang === 'en' ? 'Guarantees ➔' : 'Garanties ➔'})
      </span>
    </div>
  );
}

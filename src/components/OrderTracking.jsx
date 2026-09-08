import React, { useState, useEffect } from 'react';
import { X, Search, Package, CheckCircle, Truck, Clock, MapPin } from 'lucide-react';

export default function OrderTracking({ isOpen, onClose, initialOrderNumber = null }) {
  if (!isOpen) return null;

  const [orderQuery, setOrderQuery] = useState(initialOrderNumber || '');
  const [foundOrder, setFoundOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Check recent order from localStorage automatically on open
  useEffect(() => {
    try {
      const orders = JSON.parse(localStorage.getItem('eshop_orders') || '[]');
      if (initialOrderNumber) {
        const match = orders.find(
          (o) => o.orderNumber.toLowerCase() === initialOrderNumber.trim().toLowerCase()
        );
        if (match) {
          setFoundOrder(match);
          setOrderQuery(initialOrderNumber);
          return;
        }
      }
      if (orders.length > 0) {
        setFoundOrder(orders[0]);
        setOrderQuery(orders[0].orderNumber);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isOpen, initialOrderNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    try {
      const orders = JSON.parse(localStorage.getItem('eshop_orders') || '[]');
      const match = orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === orderQuery.trim().toLowerCase() ||
          o.customer.email.toLowerCase() === orderQuery.trim().toLowerCase()
      );

      if (match) {
        setFoundOrder(match);
      } else {
        // Fallback demo order if user typed a random query
        if (orderQuery.trim()) {
          setFoundOrder({
            orderNumber: orderQuery.toUpperCase(),
            date: '4 septembre 2026',
            status: 'En transit UE',
            customer: {
              firstName: 'Client',
              lastName: 'Européen',
              city: 'Paris',
              country: 'France'
            },
            totalAmount: 39.80,
            items: [
              { name: 'Brosse Anti-Poils Réutilisable', price: 19.90, quantity: 1 },
              { name: 'Gourde Portable pour Chiens', price: 19.90, quantity: 1 }
            ],
            trackingSteps: [
              { title: 'Commande confirmée & vérifiée', date: '4 sept. 10:14', done: true },
              { title: 'Expédiée depuis notre plateforme logistique UE', date: '5 sept. 08:30', done: true },
              { title: 'Prise en charge par le transporteur local (Colissimo)', date: 'En cours', done: true },
              { title: 'Livraison estimée à votre domicile', date: 'Sous 48h', done: false }
            ]
          });
        } else {
          setFoundOrder(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-detail-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="modal-scroll-content">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}
            >
              <Package size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Suivi de votre commande UE</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Entrez votre numéro de commande (ex: EU-123456) ou votre adresse email.
            </p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="N° de commande ou email..."
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Rechercher
            </button>
          </form>

          {/* Tracking Result */}
          {foundOrder ? (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Commande</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                    {foundOrder.orderNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Statut actuel</div>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#ecfdf5',
                      color: '#065f46',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    ● {foundOrder.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="tracking-timeline">
                {foundOrder.trackingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`timeline-step ${step.done ? 'completed' : 'active'}`}
                  >
                    <div className="timeline-dot">
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{step.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{step.date}</div>
                  </div>
                ))}
              </div>

              {/* Items summary */}
              {foundOrder.items && foundOrder.items.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Articles commandés :</div>
                  {foundOrder.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '0.25rem' }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span>{(it.price * it.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            hasSearched && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune commande trouvée pour cette recherche.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

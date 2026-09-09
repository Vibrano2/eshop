import React, { useState } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { apiDownloadInvoicePdf } from '../services/api';

export default function InvoiceModal({ order, isOpen, onClose }) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const orderDate = order.date ? new Date(order.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('fr-FR');

  const invoiceNumber = `FAC-${order.orderNumber}`;
  const items = order.items || [];
  const subtotal = Number(order.subtotal || order.totalAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const shipping = Number(order.shippingFee || 0);
  const totalTtc = Number(order.totalAmount || 0);

  // European VAT calculation (French Standard 20% included in consumer price)
  const totalHt = totalTtc / 1.20;
  const tvaTotal = totalTtc - totalHt;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await apiDownloadInvoicePdf(order.orderNumber);
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Action Bar (hidden in print) */}
        <div className="invoice-action-bar no-print">
          <div className="invoice-action-title">
            <span>Facture {invoiceNumber}</span>
            <span className="invoice-status-tag">
              <CheckCircle size={14} /> Payée
            </span>
          </div>
          <div className="invoice-action-buttons">
            <button
              className="invoice-btn-primary"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Télécharger la facture officielle PDF certifiée"
              style={{ background: '#1e3a8a', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Télécharger PDF</span>
                </>
              )}
            </button>
            <button
              className="invoice-btn-primary"
              onClick={handlePrint}
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer size={16} />
              <span>Imprimer</span>
            </button>
            <button
              className="invoice-btn-close"
              onClick={onClose}
              aria-label="Fermer la facture"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="invoice-sheet printable-area">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-brand">
              <div className="invoice-logo">
                <span className="brand-star">★</span>
                <span className="brand-title">eshop<span>-store.eu</span></span>
              </div>
              <p className="invoice-slogan">Le quotidien simplifié • Expédition express UE</p>
              <div className="invoice-seller-details">
                <p><strong>ESHOP EUROPE COMMERCE SAS</strong></p>
                <p>15 Rue de Rivoli, 75001 Paris — France</p>
                <p>N° TVA : FR 82 912 345 678 | SIRET : 912 345 678 00019</p>
                <p>support@eshop-store.eu • https://eshop-store.eu</p>
              </div>
            </div>

            <div className="invoice-meta-box">
              <div className="invoice-badge">FACTURE OFFICIELLE</div>
              <table className="invoice-meta-table">
                <tbody>
                  <tr>
                    <td><strong>N° Facture :</strong></td>
                    <td className="text-right font-mono">{invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Date d'émission :</strong></td>
                    <td className="text-right">{orderDate}</td>
                  </tr>
                  <tr>
                    <td><strong>N° Commande :</strong></td>
                    <td className="text-right font-mono">{order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Mode de règlement :</strong></td>
                    <td className="text-right">Carte Bancaire (3D Secure)</td>
                  </tr>
                  <tr>
                    <td><strong>État du paiement :</strong></td>
                    <td className="text-right text-success font-bold">Acquitté ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-divider" />

          {/* Addresses Row */}
          <div className="invoice-addresses-grid">
            <div className="invoice-address-card">
              <span className="address-label">ADRESSE DE FACTURATION</span>
              <p className="customer-name font-bold">
                {order.customerFirstName} {order.customerLastName}
              </p>
              <p>{order.shippingAddress || 'Adresse non renseignée'}</p>
              <p>{order.postalCode} {order.city}</p>
              <p>{order.countryCode || 'FR'} — Union Européenne</p>
              <p className="customer-email">{order.customerEmail}</p>
            </div>

            <div className="invoice-address-card">
              <span className="address-label">ADRESSE DE LIVRAISON</span>
              <p className="customer-name font-bold">
                {order.customerFirstName} {order.customerLastName}
              </p>
              <p>{order.shippingAddress || 'Adresse non renseignée'}</p>
              <p>{order.postalCode} {order.city}</p>
              <p>{order.countryCode || 'FR'} — Union Européenne</p>
              <p className="carrier-badge">
                Transporteur : <strong>{order.carrier || 'Colissimo Europe'}</strong>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Désignation de l'article</th>
                <th className="text-center">Qté</th>
                <th className="text-right">Prix Unit. HT</th>
                <th className="text-right">TVA</th>
                <th className="text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const price = Number(item.unit_price || item.price || 0);
                  const qty = Number(item.quantity || 1);
                  const itemTotalTtc = price * qty;
                  const itemTotalHt = itemTotalTtc / 1.20;

                  return (
                    <tr key={item.id || idx}>
                      <td>
                        <div className="invoice-item-name font-bold">
                          {item.product_name || item.name}
                        </div>
                        {item.variant && (
                          <div className="invoice-item-variant">Option : {item.variant}</div>
                        )}
                        <div className="invoice-item-sku">SKU : {item.product_id || `SKU-${idx + 101}`}</div>
                      </td>
                      <td className="text-center">{qty}</td>
                      <td className="text-right">{(itemTotalHt / qty).toFixed(2)} €</td>
                      <td className="text-right">20 %</td>
                      <td className="text-right font-bold">{itemTotalTtc.toFixed(2)} €</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td>
                    <div className="invoice-item-name font-bold">Commande Eshop Store</div>
                    <div className="invoice-item-sku">Réf : {order.orderNumber}</div>
                  </td>
                  <td className="text-center">1</td>
                  <td className="text-right">{(subtotal / 1.20).toFixed(2)} €</td>
                  <td className="text-right">20 %</td>
                  <td className="text-right font-bold">{subtotal.toFixed(2)} €</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="invoice-totals-wrapper">
            <div className="invoice-notes">
              <div className="invoice-guarantee-box">
                <ShieldCheck size={18} color="#059669" />
                <div>
                  <strong>Garantie légale 2 ans</strong>
                  <p>Tous nos articles bénéficient de la garantie légale de conformité de 2 ans dans l'UE et de 30 jours pour changer d'avis.</p>
                </div>
              </div>
            </div>

            <table className="invoice-totals-table">
              <tbody>
                <tr>
                  <td>Sous-total Hors Taxes (HT) :</td>
                  <td className="text-right">{totalHt.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td>TVA (20.00 % collectée) :</td>
                  <td className="text-right">{tvaTotal.toFixed(2)} €</td>
                </tr>
                {discount > 0 && (
                  <tr className="discount-row">
                    <td>Remise fidélité / promotion :</td>
                    <td className="text-right text-danger">-{discount.toFixed(2)} €</td>
                  </tr>
                )}
                <tr>
                  <td>Frais de livraison UE :</td>
                  <td className="text-right">
                    {shipping === 0 ? <span className="text-success font-bold">OFFERT</span> : `${shipping.toFixed(2)} €`}
                  </td>
                </tr>
                <tr className="grand-total-row">
                  <td><strong>TOTAL TTC RÉGLÉ :</strong></td>
                  <td className="text-right"><strong>{totalTtc.toFixed(2)} €</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer legal mention */}
          <div className="invoice-legal-footer">
            <p>
              Facture acquittée le {orderDate} via notre passerelle de paiement sécurisé certifiée PCI-DSS.
              TVA non applicable selon directive européenne si autoliquidation B2B.
              Service client réactif : support@eshop-store.eu ou depuis votre espace client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

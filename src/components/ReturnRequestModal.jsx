import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  Package,
  CheckCircle,
  Truck,
  Printer,
  Download,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Gift,
  HelpCircle,
  Calendar,
  Check
} from 'lucide-react';
import { apiCreateReturnRequest } from '../services/api';

const RETURN_REASONS = [
  { id: 'satisfaction_30d', label: 'Droit de rétractation légal 30 jours (Satisfait ou remboursé)' },
  { id: 'defective', label: 'Article défectueux ou panne constatée' },
  { id: 'not_as_described', label: 'Non conforme à la description ou aux photos' },
  { id: 'wrong_item', label: 'Mauvaise référence, taille ou coloris reçu' },
  { id: 'damaged_delivery', label: 'Colis ou article endommagé pendant le transport' },
  { id: 'other', label: 'Autre motif' }
];

export default function ReturnRequestModal({
  order = {},
  currentUser,
  onClose,
  onReturnCreated,
  existingReturn = null
}) {
  const [step, setStep] = useState(existingReturn ? 4 : 1); // 1: items, 2: reason, 3: refund, 4: label
  const [selectedItems, setSelectedItems] = useState(() => {
    if (existingReturn) return {};
    // Default: select all items with max quantity
    const initial = {};
    (order.items || []).forEach((item, index) => {
      initial[item.product_id || item.id || index] = {
        selected: true,
        quantity: item.quantity || 1,
        maxQuantity: item.quantity || 1,
        name: item.product_name || item.name,
        price: Number(item.unit_price || item.price || 0),
        image: item.product_image || item.image || '',
        variant: item.variant || null,
        id: item.product_id || item.id || index
      };
    });
    return initial;
  });

  const [reason, setReason] = useState('satisfaction_30d');
  const [details, setDetails] = useState('');
  const [refundMode, setRefundMode] = useState('store_credit_bonus'); // 'original_payment' | 'store_credit_bonus'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdRma, setCreatedRma] = useState(existingReturn);

  // Toggle item selection
  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected
      }
    }));
  };

  // Change quantity
  const handleQuantityChange = (itemId, qty) => {
    const validQty = Math.max(1, Math.min(selectedItems[itemId].maxQuantity, Number(qty) || 1));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: validQty
      }
    }));
  };

  // Compute refund subtotal
  const selectedList = Object.values(selectedItems).filter((i) => i.selected);
  const rawSubtotal = selectedList.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const finalRefundAmount = refundMode === 'store_credit_bonus'
    ? Number((rawSubtotal * 1.05).toFixed(2))
    : Number(rawSubtotal.toFixed(2));
  const bonusDiff = Number((finalRefundAmount - rawSubtotal).toFixed(2));

  // Handle Form Submission
  const handleSubmitReturn = async () => {
    if (!selectedList.length) {
      setErrorMessage('Veuillez sélectionner au moins un article à retourner.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        items: selectedList.map((i) => ({
          productId: i.id,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          variant: i.variant,
          image: i.image
        })),
        reason: RETURN_REASONS.find((r) => r.id === reason)?.label || reason,
        details,
        refundMode,
        customerEmail: order.customer_email || order.customerEmail || currentUser?.email,
        customerName: `${order.customer_first_name || order.customerFirstName || ''} ${order.customer_last_name || order.customerLastName || ''}`.trim()
      };

      const res = await apiCreateReturnRequest(order.order_number || order.orderNumber, payload);
      if (res.success && res.returnRequest) {
        setCreatedRma(res.returnRequest);
        setStep(4);
        if (onReturnCreated) onReturnCreated(res.returnRequest);
      } else {
        setErrorMessage(res.error || 'Une erreur est survenue lors de la création de votre retour.');
      }
    } catch (err) {
      console.error('Submit return error:', err);
      setErrorMessage('Impossible d’enregistrer le retour. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="return-modal-overlay" onClick={onClose}>
      <div className="return-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <header className="return-modal-header">
          <div className="return-header-title">
            <div className="return-header-icon">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3>Portail Retours & SAV Client</h3>
              <span className="return-header-sub">
                Commande #{order.order_number || order.orderNumber} • Garantie Satisfait ou Remboursé 30j
              </span>
            </div>
          </div>
          <button className="return-modal-close" onClick={onClose} title="Fermer">
            <X size={20} />
          </button>
        </header>

        {/* Stepper (Steps 1 to 3) */}
        {step < 4 && (
          <div className="return-stepper">
            <div className={`return-step-pill ${step >= 1 ? 'active' : ''}`}>
              <span className="step-num">1</span>
              <span className="step-txt">Articles</span>
            </div>
            <div className="return-step-divider" />
            <div className={`return-step-pill ${step >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-txt">Motif</span>
            </div>
            <div className="return-step-divider" />
            <div className={`return-step-pill ${step >= 3 ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-txt">Remboursement</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="return-modal-body">
          {errorMessage && (
            <div className="return-error-alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT ITEMS */}
          {step === 1 && (
            <div className="return-step-content">
              <div className="return-section-intro">
                <h4>Quels articles souhaitez-vous retourner ?</h4>
                <p>Cochez les produits et indiquez la quantité à renvoyer dans le colis.</p>
              </div>

              <div className="return-items-list">
                {(order.items || []).map((item, idx) => {
                  const itemId = item.product_id || item.id || idx;
                  const itemState = selectedItems[itemId] || { selected: false, quantity: 1, maxQuantity: 1 };

                  return (
                    <div
                      key={itemId}
                      className={`return-item-card ${itemState.selected ? 'selected' : ''}`}
                      onClick={() => handleToggleItem(itemId)}
                    >
                      <div className="return-item-checkbox">
                        <input
                          type="checkbox"
                          checked={itemState.selected}
                          onChange={() => {}} // handled by parent onClick
                          aria-label="Sélectionner pour retour"
                        />
                      </div>
                      <img
                        src={item.product_image || item.image || item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80'}
                        alt={item.product_name || item.name}
                        className="return-item-thumb"
                      />
                      <div className="return-item-info">
                        <span className="return-item-title">{item.product_name || item.name}</span>
                        {item.variant && <span className="return-item-variant">Option : {item.variant}</span>}
                        <span className="return-item-unit-price">
                          Prix unitaire : {Number(item.unit_price || item.price || 0).toFixed(2)} €
                        </span>
                      </div>

                      {itemState.selected && (
                        <div className="return-item-qty-control" onClick={(e) => e.stopPropagation()}>
                          <label>Qté :</label>
                          <select
                            value={itemState.quantity}
                            onChange={(e) => handleQuantityChange(itemId, Number(e.target.value))}
                          >
                            {Array.from({ length: itemState.maxQuantity }, (_, i) => i + 1).map((q) => (
                              <option key={q} value={q}>
                                {q}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="return-summary-preview">
                <span>Articles sélectionnés : <strong>{selectedList.length}</strong></span>
                <span>Montant estimé : <strong className="return-amount-highlight">{rawSubtotal.toFixed(2)} €</strong></span>
              </div>
            </div>
          )}

          {/* STEP 2: REASON & DETAILS */}
          {step === 2 && (
            <div className="return-step-content">
              <div className="return-section-intro">
                <h4>Quel est le motif de votre retour ?</h4>
                <p>Ces précisions nous permettent d'améliorer nos produits et d'accélérer le traitement logistique.</p>
              </div>

              <div className="return-reasons-grid">
                {RETURN_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`return-reason-option ${reason === r.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              <div className="return-details-group">
                <label htmlFor="returnDetails">Commentaires ou détails supplémentaires (optionnel) :</label>
                <textarea
                  id="returnDetails"
                  rows="3"
                  placeholder="Décrivez l'état de l'article ou toute information utile pour notre équipe de contrôle qualité..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: REFUND MODE */}
          {step === 3 && (
            <div className="return-step-content">
              <div className="return-section-intro">
                <h4>Choisissez votre modalité de dédommagement</h4>
                <p>Nous vous proposons le remboursement immédiat en bon d'achat bonifié ou le recrédit bancaire classique.</p>
              </div>

              <div className="return-refund-options">
                {/* Option 1: Store Credit with +5% bonus */}
                <div
                  className={`refund-option-card bonus-card ${refundMode === 'store_credit_bonus' ? 'active' : ''}`}
                  onClick={() => setRefundMode('store_credit_bonus')}
                >
                  <div className="refund-card-radio">
                    <input
                      type="radio"
                      name="refundMode"
                      checked={refundMode === 'store_credit_bonus'}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="refund-card-body">
                    <div className="refund-card-header">
                      <Gift size={20} className="bonus-icon" />
                      <h5>Avoir boutique immédiat (+5% de bonus offert)</h5>
                      <span className="bonus-pill">Recommandé</span>
                    </div>
                    <p className="refund-card-desc">
                      Recevez un bon d'achat utilisable sans limite de temps sur toute la boutique avec <strong>+5% de crédit offert</strong> par Eshop.
                    </p>
                    <div className="refund-card-calc">
                      <span>Montant crédité :</span>
                      <strong className="refund-card-total bonus-amount">
                        {finalRefundAmount.toFixed(2)} €
                      </strong>
                      <span className="bonus-detail">
                        ({rawSubtotal.toFixed(2)} € + {bonusDiff.toFixed(2)} € offerts)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Original Payment */}
                <div
                  className={`refund-option-card ${refundMode === 'original_payment' ? 'active' : ''}`}
                  onClick={() => setRefundMode('original_payment')}
                >
                  <div className="refund-card-radio">
                    <input
                      type="radio"
                      name="refundMode"
                      checked={refundMode === 'original_payment'}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="refund-card-body">
                    <div className="refund-card-header">
                      <CreditCard size={20} />
                      <h5>Remboursement bancaire d'origine</h5>
                    </div>
                    <p className="refund-card-desc">
                      Recrédit automatique sur la carte bancaire utilisée lors de la commande sous 3 à 5 jours après réception du colis.
                    </p>
                    <div className="refund-card-calc">
                      <span>Montant remboursé :</span>
                      <strong className="refund-card-total">
                        {rawSubtotal.toFixed(2)} €
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees Reminder */}
              <div className="return-guarantees-bar">
                <div className="return-guarantee-item">
                  <Truck size={16} />
                  <span>Étiquette Colissimo prépayée offerte</span>
                </div>
                <div className="return-guarantee-item">
                  <ShieldCheck size={16} />
                  <span>Contrôle qualité sous 48h</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRINTABLE RETURN LABEL & PACKING SLIP */}
          {step === 4 && createdRma && (
            <div className="return-step-content step-label-generated">
              <div className="return-success-banner">
                <CheckCircle size={24} color="#059669" />
                <div>
                  <h4>Votre demande de retour est validée !</h4>
                  <p>
                    Dossier N° <strong>{createdRma.id}</strong> • Étiquette prépayée Colissimo générée avec succès.
                  </p>
                </div>
              </div>

              {/* Printable Carrier Label Card */}
              <div className="colissimo-return-label-container" id="printableReturnLabel">
                <div className="colissimo-label-header">
                  <div className="colissimo-logo-block">
                    <span className="colissimo-badge">COLISSIMO</span>
                    <span className="colissimo-return-type">RETOUR MARCHANDISE UE</span>
                  </div>
                  <div className="colissimo-rma-block">
                    <span className="rma-title">N° AUTORISATION (RMA)</span>
                    <strong className="rma-code font-mono">{createdRma.id}</strong>
                    <span className="rma-order-ref">Cde #{createdRma.orderNumber}</span>
                  </div>
                </div>

                <div className="colissimo-addresses-grid">
                  <div className="colissimo-address-box exp">
                    <span className="box-role">EXPÉDITEUR :</span>
                    <p className="box-name">{createdRma.customerName || currentUser?.firstName + ' ' + currentUser?.lastName || 'Client Eshop'}</p>
                    <p className="box-street">{createdRma.senderAddress?.address || order.shipping_address || 'Adresse client'}</p>
                    <p className="box-city">
                      {createdRma.senderAddress?.postalCode || order.postal_code} {createdRma.senderAddress?.city || order.city} ({createdRma.senderAddress?.countryCode || order.country_code || 'FR'})
                    </p>
                  </div>

                  <div className="colissimo-address-box dest">
                    <span className="box-role">DESTINATAIRE :</span>
                    <p className="box-name font-bold">ESHOP LOGISTIQUE RETOURS UE</p>
                    <p className="box-street">Plateforme Centrale Quai 12 - RMA Dept</p>
                    <p className="box-street">45 Rue de la Logistique</p>
                    <p className="box-city font-bold">93290 TREMBLAY-EN-FRANCE (FRANCE)</p>
                  </div>
                </div>

                {/* Stylized Barcode */}
                <div className="colissimo-barcode-box">
                  <div className="barcode-bars-graphic">
                    {/* Simulated SVG Barcode */}
                    <svg className="barcode-svg" viewBox="0 0 260 48" preserveAspectRatio="none">
                      <rect x="0" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="6" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="12" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="20" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="25" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="32" y="0" width="1" height="48" fill="#1e293b" />
                      <rect x="36" y="0" width="6" height="48" fill="#1e293b" />
                      <rect x="45" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="52" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="58" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="65" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="70" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="78" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="84" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="90" y="0" width="6" height="48" fill="#1e293b" />
                      <rect x="100" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="106" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="113" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="118" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="126" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="131" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="138" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="144" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="152" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="158" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="165" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="171" y="0" width="6" height="48" fill="#1e293b" />
                      <rect x="180" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="185" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="192" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="198" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="206" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="211" y="0" width="4" height="48" fill="#1e293b" />
                      <rect x="218" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="223" y="0" width="6" height="48" fill="#1e293b" />
                      <rect x="232" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="238" y="0" width="2" height="48" fill="#1e293b" />
                      <rect x="243" y="0" width="5" height="48" fill="#1e293b" />
                      <rect x="251" y="0" width="3" height="48" fill="#1e293b" />
                      <rect x="257" y="0" width="3" height="48" fill="#1e293b" />
                    </svg>
                  </div>
                  <span className="barcode-number font-mono font-bold">
                    {createdRma.returnLabelBarcode || '8R9283748293FR'}
                  </span>
                  <span className="barcode-type">COLISSIMO RETOUR PREPAYE • 0 - 2 KG</span>
                </div>

                {/* Packing Slip Note */}
                <div className="colissimo-packing-slip-snippet">
                  <div className="slip-header">
                    <strong>BON DE RETOUR À GLISSER DANS LE COLIS</strong>
                    <span>Montant remboursable : <strong>{createdRma.refundAmount} €</strong></span>
                  </div>
                  <ul className="slip-items">
                    {(createdRma.items || []).map((it, i) => (
                      <li key={i}>
                        {it.quantity} × {it.productName || it.name} {it.variant ? `(${it.variant})` : ''} — {Number(it.unitPrice || it.price || 0).toFixed(2)} €
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="return-instructions-card">
                <h5>Consignes de préparation de votre colis :</h5>
                <ol className="return-instructions-list">
                  <li>
                    <strong>Imprimez l'étiquette et le bon de retour</strong> en cliquant sur le bouton ci-dessous.
                  </li>
                  <li>
                    <strong>Placez les articles</strong> soigneusement emballés dans le carton, accompagnés du bon de retour.
                  </li>
                  <li>
                    <strong>Collez l'étiquette Colissimo bien à plat</strong> sur le carton par-dessus l'ancienne étiquette de livraison.
                  </li>
                  <li>
                    <strong>Déposez gratuitement votre colis</strong> dans votre boîte aux lettres personnelle (faites une demande de retrait sur laposte.fr avant 8h), dans n'importe quel bureau de Poste ou chez un commerçant relais Colissimo.
                  </li>
                </ol>
              </div>

              {/* Action Buttons for Label */}
              <div className="return-label-actions">
                <button className="return-btn-print" onClick={handlePrint}>
                  <Printer size={16} />
                  <span>Imprimer l'étiquette & le bon de retour</span>
                </button>
                <button className="return-btn-done" onClick={onClose}>
                  <Check size={16} />
                  <span>J'ai compris, fermer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1 to 3) */}
        {step < 4 && (
          <footer className="return-modal-footer">
            {step > 1 ? (
              <button
                className="return-btn-back"
                onClick={() => setStep((s) => s - 1)}
                disabled={isSubmitting}
              >
                Précédent
              </button>
            ) : (
              <button className="return-btn-cancel" onClick={onClose}>
                Annuler
              </button>
            )}

            {step < 3 ? (
              <button
                className="return-btn-next"
                onClick={() => {
                  if (step === 1 && !selectedList.length) {
                    setErrorMessage('Veuillez sélectionner au moins un article.');
                    return;
                  }
                  setErrorMessage('');
                  setStep((s) => s + 1);
                }}
              >
                <span>Continuer</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="return-btn-submit"
                onClick={handleSubmitReturn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Génération de l'étiquette...</span>
                ) : (
                  <>
                    <Truck size={16} />
                    <span>Confirmer & Générer mon étiquette Colissimo</span>
                  </>
                )}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

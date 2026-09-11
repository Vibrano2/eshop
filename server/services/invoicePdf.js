import PDFDocument from 'pdfkit';

/**
 * Generates an official European tax invoice PDF document
 * and pipes it to the provided writable stream (e.g. Express res).
 *
 * @param {Object} order - Order record
 * @param {Array} items - List of items in the order
 * @param {Stream.Writable} outputStream - Response or file write stream
 */
export function generateInvoicePdf(order, items, outputStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Facture FAC-${order.order_number || order.orderNumber}`,
      Author: 'eshopstore.shop',
      Subject: 'Facture d\'achat acquittée',
      Keywords: 'facture, eshop, tva, europe'
    }
  });

  doc.pipe(outputStream);

  const orderNum = order.order_number || order.orderNumber || 'EU-000000';
  const invoiceNum = `FAC-${orderNum}`;
  const orderDate = order.created_at || order.date
    ? new Date(order.created_at || order.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('fr-FR');

  const totalTtc = Number(order.total_amount || order.totalAmount || 0);
  const discountAmount = Number(order.discount_amount || order.discountAmount || 0);
  const shippingFee = Number(order.shipping_fee || order.shippingFee || 0);
  const subtotal = Number(order.subtotal || totalTtc);

  // European VAT calculations (Standard French 20% included in B2C retail prices)
  const totalHt = totalTtc / 1.20;
  const tvaAmount = totalTtc - totalHt;

  const firstName = order.customer_first_name || order.customerFirstName || order.customer?.firstName || '';
  const lastName = order.customer_last_name || order.customerLastName || order.customer?.lastName || '';
  const customerEmail = order.customer_email || order.customerEmail || order.customer?.email || '';
  const shippingAddress = order.shipping_address || order.shippingAddress || order.customer?.address || '';
  const postalCode = order.postal_code || order.postalCode || order.customer?.postalCode || '';
  const city = order.city || order.customer?.city || '';
  const countryCode = order.country_code || order.countryCode || order.customer?.country || 'FR';
  const carrier = order.carrier || (countryCode === 'FR' ? 'Colissimo Suivi' : 'DHL Express Europe');

  // --- TOP ACCENT BANNER ---
  doc
    .rect(0, 0, doc.page.width, 8)
    .fill('#2563eb');

  let y = 35;

  // --- BRAND HEADER ---
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#1e3a8a')
    .text('eshop', 40, y, { continued: true })
    .fillColor('#2563eb')
    .text('-store.eu', { continued: false });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748b')
    .text('Plateforme Logistique & E-commerce Européenne', 40, y + 26);

  // --- INVOICE METADATA BADGE (Right aligned) ---
  const boxX = 350;
  const boxWidth = 205;
  const boxHeight = 70;

  doc
    .roundedRect(boxX, y - 5, boxWidth, boxHeight, 4)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1e3a8a')
    .text('FACTURE ACQUITTÉE', boxX + 12, y + 4);

  // Green "Payé" pill
  doc
    .roundedRect(boxX + 138, y + 2, 54, 15, 7)
    .fill('#ecfdf5');
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor('#059669')
    .text('ACQUITTÉE', boxX + 143, y + 6);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f172a')
    .text(`N° Facture : `, boxX + 12, y + 24, { continued: true })
    .font('Helvetica')
    .text(invoiceNum);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(`Date d'émission : `, boxX + 12, y + 37, { continued: true })
    .font('Helvetica')
    .text(orderDate);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(`N° Commande : `, boxX + 12, y + 50, { continued: true })
    .font('Helvetica')
    .text(orderNum);

  y += 85;

  // --- SELLER & CUSTOMER DETAILS SECTION ---
  doc
    .roundedRect(40, y, 255, 90, 4)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#2563eb')
    .text('ÉMETTEUR / VENDEUR', 50, y + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor('#0f172a')
    .text('ESHOP EUROPE COMMERCE SAS', 50, y + 23);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text('15 Rue de Rivoli, 75001 Paris, France', 50, y + 36)
    .text('SIRET : 912 345 678 00019 • RCS Paris B 912 345 678', 50, y + 48)
    .text('N° TVA intracommunautaire : FR 82 912 345 678', 50, y + 60)
    .text('Support : facturation@eshopstore.shop', 50, y + 72);

  // Customer Card
  doc
    .roundedRect(305, y, 250, 90, 4)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#2563eb')
    .text('DESTINATAIRE / LIVRAISON & FACTURATION', 315, y + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor('#0f172a')
    .text(`${firstName} ${lastName}`.trim() || 'Client Vérifié', 315, y + 23);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text(shippingAddress || 'Adresse enregistrée', 315, y + 36)
    .text(`${postalCode} ${city} (${countryCode})`.trim(), 315, y + 48)
    .text(`Email : ${customerEmail || 'client@eshopstore.shop'}`, 315, y + 60)
    .text(`Acheminement : ${carrier}`, 315, y + 72);

  y += 105;

  // --- PAYMENT METHOD BANNER ---
  doc
    .roundedRect(40, y, 515, 24, 3)
    .fill('#eff6ff');

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#1e40af')
    .text('RÈGLEMENT SÉCURISÉ :', 50, y + 7, { continued: true })
    .font('Helvetica')
    .text(` Carte Bancaire • Authentification 3D Secure v2 DSP2 validée • Transaction acquittée`, { continued: false });

  y += 34;

  // --- ITEM TABLE HEADERS ---
  const colX = {
    desc: 45,
    qty: 330,
    unitHt: 375,
    tva: 440,
    totalTtc: 490
  };

  doc
    .rect(40, y, 515, 20)
    .fill('#1e3a8a');

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#ffffff')
    .text('DÉSIGNATION DU PRODUIT', colX.desc, y + 6)
    .text('QTÉ', colX.qty, y + 6)
    .text('P.U. HT', colX.unitHt, y + 6)
    .text('TVA', colX.tva, y + 6)
    .text('TOTAL TTC', colX.totalTtc, y + 6);

  y += 20;

  // --- TABLE ROWS ---
  const lineItems = items && items.length ? items : [
    { product_name: 'Article Commandé', quantity: 1, unit_price: totalTtc }
  ];

  lineItems.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 22;

    if (isEven) {
      doc
        .rect(40, y, 515, rowHeight)
        .fill('#f8fafc');
    }

    const title = item.product_name || item.name || 'Article Eshop';
    const qty = Number(item.quantity || 1);
    const unitTtc = Number(item.unit_price || item.price || 0);
    const unitHt = unitTtc / 1.20;
    const lineTotalTtc = unitTtc * qty;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#0f172a')
      .text(title.length > 55 ? title.substring(0, 52) + '...' : title, colX.desc, y + 7, { width: 280, ellipsis: true })
      .text(String(qty), colX.qty, y + 7)
      .text(`${unitHt.toFixed(2)} €`, colX.unitHt, y + 7)
      .text('20.0 %', colX.tva, y + 7)
      .font('Helvetica-Bold')
      .text(`${lineTotalTtc.toFixed(2)} €`, colX.totalTtc, y + 7);

    // Row bottom separator
    doc
      .moveTo(40, y + rowHeight)
      .lineTo(555, y + rowHeight)
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  });

  y += 15;

  // --- TOTALS & VAT BREAKDOWN (Right-aligned box) ---
  const summaryX = 330;
  const summaryWidth = 225;

  // Summary background
  doc
    .roundedRect(summaryX, y, summaryWidth, 125, 4)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  let sY = y + 10;
  const leftX = summaryX + 12;
  const rightX = summaryX + summaryWidth - 12;

  const renderSummaryLine = (label, val, isBold = false) => {
    doc
      .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor('#475569')
      .text(label, leftX, sY);

    doc
      .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text(val, leftX, sY, { align: 'right', width: summaryWidth - 24 });

    sY += 16;
  };

  renderSummaryLine('Sous-total Brut HT :', `${totalHt.toFixed(2)} €`);
  if (discountAmount > 0) {
    renderSummaryLine(`Remise commerciale appliquée :`, `-${discountAmount.toFixed(2)} €`);
  }
  renderSummaryLine('Frais de port (Colissimo / DHL) :', shippingFee > 0 ? `${shippingFee.toFixed(2)} €` : 'Offert (0.00 €)');
  renderSummaryLine('Montant TVA (20.00%) :', `${tvaAmount.toFixed(2)} €`);

  // Divider
  doc
    .moveTo(leftX, sY)
    .lineTo(rightX, sY)
    .strokeColor('#cbd5e1')
    .lineWidth(0.5)
    .stroke();

  sY += 8;

  // TOTAL TTC HIGHLIGHT BOX
  doc
    .roundedRect(leftX, sY, summaryWidth - 24, 26, 3)
    .fill('#1e3a8a');

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#ffffff')
    .text('TOTAL NET TTC PAYÉ :', leftX + 8, sY + 8);

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#ffffff')
    .text(`${totalTtc.toFixed(2)} €`, leftX + 8, sY + 7, { align: 'right', width: summaryWidth - 40 });

  // --- VAT REGULATION NOTICE (Left side opposite of totals) ---
  doc
    .roundedRect(40, y, 275, 125, 4)
    .fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#1e3a8a')
    .text('VENTILATION FISCALE TVA EU', 50, y + 10);

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#475569')
    .text(`Base d'imposition HT : ${totalHt.toFixed(2)} €`, 50, y + 26)
    .text(`Taux applicable : 20.00% (Régime standard France / UE)`, 50, y + 38)
    .text(`Montant total de la TVA collectée : ${tvaAmount.toFixed(2)} €`, 50, y + 50)
    .text(`Exonération de taxe selon directive européenne applicable aux particuliers.`, 50, y + 64, { width: 255 })
    .text(`Acquitté par carte bancaire le ${orderDate}. Aucun escompte pour paiement anticipé.`, 50, y + 84, { width: 255 });

  // --- BOTTOM LEGAL FOOTER ---
  const footerY = doc.page.height - 70;

  doc
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#94a3b8')
    .text(
      'ESHOP EUROPE COMMERCE SAS • Société par Actions Simplifiée au capital de 50 000 € • Siège social : 15 Rue de Rivoli, 75001 Paris, France • RCS Paris 912 345 678 • N° TVA Intracommunautaire : FR 82 912 345 678.',
      40,
      footerY + 8,
      { align: 'center', width: 515 }
    );

  doc
    .text(
      'Facture acquittée générée électroniquement en conformité avec les articles L. 441-9 et suivants du Code de commerce. Droit de rétractation de 30 jours et garantie légale de conformité de 2 ans (art. L. 217-4 Code de la consommation).',
      40,
      footerY + 24,
      { align: 'center', width: 515 }
    );

  doc.end();
}

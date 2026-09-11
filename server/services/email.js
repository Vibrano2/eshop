import nodemailer from 'nodemailer';

let cachedTransporter = null;

/**
 * Get or create Nodemailer transporter
 * Uses SMTP credentials from environment, or generates an Ethereal test inbox in dev
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: pass || ''
      }
    });
    return cachedTransporter;
  }

  // Development sandbox fallback using Ethereal Email
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('Could not initialize Ethereal test account, using JSON transport:', err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

/**
 * Generate responsive HTML order confirmation email
 */
export function generateOrderEmailHtml(order) {
  const items = order.items || [];
  const subtotal = Number(order.subtotal || order.totalAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const shipping = Number(order.shippingFee || 0);
  const totalTtc = Number(order.totalAmount || 0);
  const totalHt = totalTtc / 1.20;
  const tvaTotal = totalTtc - totalHt;

  const orderDate = order.date
    ? new Date(order.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('fr-FR');

  const trackingUrl = `https://eshopstore.shop?track=${order.orderNumber}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande #${order.orderNumber} - eshopstore.shop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center;">
              <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ★ eshop<span style="color: #3b82f6;">-store.eu</span>
              </div>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
                Gadgets Pratiques du Quotidien • Expédition Express Union Européenne
              </p>
            </td>
          </tr>

          <!-- Confirmation Hero -->
          <tr>
            <td style="padding: 32px 28px 20px 28px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="width: 52px; height: 52px; background-color: #ecfdf5; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #059669; font-size: 28px; line-height: 52px;">✓</span>
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">
                Merci pour votre commande !
              </h1>
              <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                Bonjour <strong>${order.customerFirstName || 'Client'}</strong>, nous avons bien reçu votre commande <strong>#${order.orderNumber}</strong>. Nos équipes logistiques préparent votre colis avec soin.
              </p>
            </td>
          </tr>

          <!-- Order Summary Meta -->
          <tr>
            <td style="padding: 20px 28px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Numéro de commande :</td>
                  <td align="right" style="font-weight: 700; font-family: monospace; color: #0f172a;">#${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Date d'achat :</td>
                  <td align="right" style="color: #0f172a;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Mode de paiement :</td>
                  <td align="right" style="color: #059669; font-weight: 700;">Carte Bancaire (3D Secure v2) ✓</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Transporteur UE :</td>
                  <td align="right" style="color: #0f172a; font-weight: 600;">${order.carrier || 'Colissimo Europe'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products Table -->
          <tr>
            <td style="padding: 24px 28px;">
              <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Détail de vos articles
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px;">
                ${items.map((item) => `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                      <div style="font-weight: 700; color: #0f172a; font-size: 14px;">
                        ${item.product_name || item.name}
                      </div>
                      ${item.variant ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Option : ${item.variant}</div>` : ''}
                      <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Qté : ${item.quantity || 1} × ${Number(item.unit_price || item.price || 0).toFixed(2)} €</div>
                    </td>
                    <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; vertical-align: top;">
                      ${(Number(item.unit_price || item.price || 0) * Number(item.quantity || 1)).toFixed(2)} €
                    </td>
                  </tr>
                `).join('')}
              </table>

              <!-- Totals Breakdown -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Sous-total HT :</td>
                  <td align="right" style="padding: 4px 0; color: #0f172a;">${totalHt.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">TVA (20.00 % collectée) :</td>
                  <td align="right" style="padding: 4px 0; color: #0f172a;">${tvaTotal.toFixed(2)} €</td>
                </tr>
                ${discount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #dc2626;">Remise promotionnelle :</td>
                    <td align="right" style="padding: 4px 0; color: #dc2626; font-weight: 700;">-${discount.toFixed(2)} €</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Frais de livraison UE :</td>
                  <td align="right" style="padding: 4px 0; color: #059669; font-weight: 700;">
                    ${shipping === 0 ? 'OFFERT' : `${shipping.toFixed(2)} €`}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a;">
                    Total TTC réglé :
                  </td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a;">
                    ${totalTtc.toFixed(2)} €
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address & CTA -->
          <tr>
            <td style="padding: 24px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <table width="100%" cellspacing="0" cellpadding="0" style="text-align: left; font-size: 13px; margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #ffffff; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                      Adresse de livraison enregistrée :
                    </div>
                    <div style="font-weight: 700; color: #0f172a;">${order.customerFirstName} ${order.customerLastName}</div>
                    <div style="color: #475569; margin-top: 2px;">${order.shippingAddress || ''}</div>
                    <div style="color: #475569;">${order.postalCode} ${order.city} (${order.countryCode || 'FR'})</div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                Suivre l'acheminement de mon colis ➔
              </a>
              <div style="margin-top: 12px; font-size: 12px; color: #64748b;">
                Vous pouvez également consulter votre facture officielle PDF sur votre <a href="https://eshopstore.shop/account" style="color: #2563eb; font-weight: 600;">espace Mon Compte</a>.
              </div>
            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="padding: 24px 28px; background-color: #0f172a; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #ffffff; font-weight: 700; font-size: 12px;">
                ESHOP EUROPE COMMERCE SAS — eshopstore.shop
              </p>
              <p style="margin: 0;">
                15 Rue de Rivoli, 75001 Paris — N° TVA : FR 82 912 345 678 | SIRET : 912 345 678 00019<br>
                Garantie légale de conformité 2 ans UE • Droit de rétractation 30 jours • Support 7j/7 : support@eshopstore.shop
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order) {
  try {
    const transporter = await getTransporter();
    const customerEmail = order.customerEmail || order.customer?.email;

    if (!customerEmail) {
      return { success: false, error: 'Email du destinataire manquant.' };
    }

    const htmlContent = generateOrderEmailHtml(order);
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"eshopstore.shop" <commandes@eshopstore.shop>';

    const mailOptions = {
      from: fromAddress,
      to: customerEmail,
      subject: `Confirmation de votre commande #${order.orderNumber} • eshopstore.shop`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    if (previewUrl) {
      console.log(`✉️ Email confirmation dispatched! Web preview: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

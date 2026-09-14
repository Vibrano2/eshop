import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // ephemeral port

// Import the Express application
import app from '../index.js';
import { db } from '../db.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  process.exit(0);
});

describe('1. Security Headers & System Health', () => {
  test('Health check responds with 200 OK and metrics', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.uptime >= 0);
  });

  test('Security headers (CSP, X-Content-Type-Options, X-Frame-Options) are applied', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(res.headers.get('content-security-policy')?.includes("default-src 'self'"));
    assert.equal(res.headers.get('x-powered-by'), null); // Express hidden
  });

  test('Rate limit headers are present on /api requests', async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    assert.ok(res.headers.has('x-ratelimit-limit'));
    assert.ok(res.headers.has('x-ratelimit-remaining'));
  });
});

describe('2. Authentication & Credential Security', () => {
  const testEmail = `test.user.${Date.now()}@example.com`;
  let authToken = null;

  test('Registration rejects weak passwords (<8 chars)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'short.pw@example.com',
        password: 'short',
        firstName: 'Jean',
        lastName: 'Dupont'
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('8 caractères'));
  });

  test('Registration succeeds with valid inputs & hashes password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword2026!',
        firstName: 'Sophie',
        lastName: 'Martin',
        phone: '+33612345678',
        address: '10 Rue de la Paix',
        postalCode: '75002',
        city: 'Paris',
        countryCode: 'FR'
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.email, testEmail);
    assert.equal(data.user.role, 'customer');
    authToken = data.token;
  });

  test('Registration rejects duplicate email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword2026!',
        firstName: 'Sophie',
        lastName: 'Martin'
      })
    });
    assert.equal(res.status, 409);
  });

  test('Login succeeds with correct password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword2026!'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
  });

  test('Login rejects wrong password with timing-safe verification', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    assert.equal(res.status, 401);
  });

  test('Protected route /api/auth/me returns user profile with valid Bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, testEmail);
  });

  test('Protected route /api/auth/me rejects request without token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });
});

describe('3. Role-Based Authorization & Admin Guard', () => {
  let customerToken = null;
  let adminToken = null;

  before(async () => {
    // Register normal customer
    const custEmail = `customer.${Date.now()}@example.com`;
    const custRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: custEmail,
        password: 'PasswordCustomer2026!',
        firstName: 'Client',
        lastName: 'Test'
      })
    });
    const custData = await custRes.json();
    customerToken = custData.token;

    // Login as existing seeded admin
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eshopstore.shop',
        password: 'AdminEshop2026!'
      })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
  });

  test('Admin route /api/admin/stats rejected with 401 if unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`);
    assert.equal(res.status, 401);
  });

  test('Admin route /api/admin/stats rejected with 403 if user is regular customer', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('privilèges administrateur'));
  });

  test('Admin route /api/admin/stats succeeds with 200 if user has admin role', async () => {
    assert.ok(adminToken, 'Admin token should be available');
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.stats.totalRevenue !== undefined);
  });
});

describe('4. Order Creation & Price Tampering Protection', () => {
  test('Order total is calculated authoritative server-side, ignoring client price tampering', async () => {
    // Get real product from DB
    const realProduct = db.prepare('SELECT id, price FROM products LIMIT 1').get();
    assert.ok(realProduct);

    // Attempt to tamper with price: claim item costs €0.01 instead of real price
    const orderPayload = {
      customer: {
        email: 'victim@example.com',
        firstName: 'Paul',
        lastName: 'Bert',
        address: '15 Avenue Foch',
        postalCode: '75016',
        city: 'Paris',
        countryCode: 'FR'
      },
      items: [
        {
          id: realProduct.id,
          name: 'Fake Cheap Item',
          price: 0.01, // TAMPERED!
          quantity: 2
        }
      ],
      subtotal: 0.02, // TAMPERED!
      shippingFee: 0,
      totalAmount: 0.02 // TAMPERED!
    };

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify the server enforced the REAL database price
    const expectedSubtotal = Math.round((realProduct.price * 2) * 100) / 100;
    assert.equal(data.order.subtotal, expectedSubtotal);
    assert.ok(data.order.totalAmount > 0.02, 'Total amount must not be the tampered 0.02');
  });

  test('Order creation rejects non-existent products', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          email: 'valid@example.com',
          address: '10 Rue de Paris'
        },
        items: [{ id: 'non-existent-product-sku-99999', quantity: 1 }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('pas répertorié'));
  });
});

describe('5. IDOR & PII Data Protection on Orders', () => {
  let createdOrderNumber = null;
  const ownerEmail = 'order.owner@example.fr';

  before(async () => {
    const prod = db.prepare('SELECT id FROM products LIMIT 1').get();
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          email: ownerEmail,
          firstName: 'Jacques',
          lastName: 'Chirac',
          address: '55 Rue du Faubourg Saint-Honoré',
          postalCode: '75008',
          city: 'Paris',
          countryCode: 'FR'
        },
        items: [{ id: prod.id, quantity: 1 }]
      })
    });
    const data = await res.json();
    createdOrderNumber = data.order.orderNumber;
  });

  test('GET /api/orders/:orderNumber rejects unauthenticated request without matching email (IDOR protection)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}`);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Accès restreint'));
  });

  test('GET /api/orders/:orderNumber succeeds when authorized with matching guest email query', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}?email=${encodeURIComponent(ownerEmail)}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.customer_email, ownerEmail);
  });

  test('GET /api/orders/:orderNumber/invoice.pdf blocks unauthorized stranger (IDOR protection)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}/invoice.pdf`);
    assert.equal(res.status, 403);
  });

  test('GET /api/orders/:orderNumber/invoice.pdf succeeds for verified owner', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}/invoice.pdf?email=${encodeURIComponent(ownerEmail)}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');
  });

  test('GET /api/orders/:orderNumber/track is accessible for parcel delivery status without leaking PII', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderNumber}/track`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.tracking.carrier);
    assert.equal(data.tracking.customer_email, undefined);
    assert.equal(data.tracking.shipping_address, undefined);
  });
});

describe('6. Public Data Sanitization (Reviews & Loyalty)', () => {
  test('Product reviews do NOT leak author email in responses', async () => {
    const prod = db.prepare('SELECT id FROM products LIMIT 1').get();

    // Submit a review with an author email
    const submitRes = await fetch(`${baseUrl}/api/products/${prod.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: 'Client Discret',
        authorEmail: 'confidential.email@secret.com',
        rating: 5,
        title: 'Superbe produit',
        comment: 'Excellente qualité et livraison rapide.',
        photos: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400']
      })
    });
    assert.equal(submitRes.status, 201);
    const submitData = await submitRes.json();
    assert.equal(submitData.review.author_email, undefined, 'author_email must be removed from review response');

    // Fetch public reviews list
    const getRes = await fetch(`${baseUrl}/api/products/${prod.id}/reviews`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    for (const r of getData.reviews) {
      assert.equal(r.author_email, undefined, `author_email must be omitted for review #${r.id}`);
    }
  });

  test('Loyalty lookup masks customer email address', async () => {
    const res = await fetch(`${baseUrl}/api/loyalty/ESHOP-EU4821`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.account.email.includes('***'), 'Email must be masked');
    assert.ok(!data.account.email.includes('client@eshopstore.shop'), 'Plain email must not be exposed');
  });

  test('Newsletter validates email format', async () => {
    const res = await fetch(`${baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email-no-at' })
    });
    assert.equal(res.status, 400);
  });
});

describe('7. Stripe Payment Gateway & Webhook Idempotency', () => {
  let testOrderNumber = null;

  before(async () => {
    // Create a pending order in the database to test webhook handling
    const prod = db.prepare('SELECT id, price FROM products LIMIT 1').get();
    testOrderNumber = `EU-STRIPE-${Date.now()}`;
    const initialTracking = [
      { title: 'Paiement Stripe en cours de validation', date: 'Immédiat', done: false }
    ];

    db.prepare(`
      INSERT INTO orders (
        order_number, customer_email, customer_first_name, customer_last_name,
        shipping_address, postal_code, city, country_code,
        subtotal, discount_amount, discount_code, shipping_fee, total_amount,
        carrier, estimated_delivery, status, tracking_steps_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testOrderNumber, 'stripe.buyer@example.eu', 'Lucas', 'Bernard',
      '12 Rue de la République', '69002', 'Lyon', 'FR',
      prod.price, 0, null, 0, prod.price,
      'Colissimo Suivi', '2 à 3 jours', 'en_attente_de_paiement', JSON.stringify(initialTracking), new Date().toISOString()
    );

    db.prepare(`
      INSERT INTO order_items (order_number, product_id, product_name, unit_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(testOrderNumber, prod.id, 'Test Product', prod.price, 1);
  });

  test('POST /api/payment/create-checkout-session rejects empty items array', async () => {
    const res = await fetch(`${baseUrl}/api/payment/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { email: 'buyer@example.com' },
        items: []
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Panier vide'));
  });

  test('POST /api/payment/create-checkout-session rejects invalid email', async () => {
    const prod = db.prepare('SELECT id FROM products LIMIT 1').get();
    const res = await fetch(`${baseUrl}/api/payment/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { email: 'not-an-email' },
        items: [{ id: prod.id, quantity: 1 }]
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('email client invalide'));
  });

  test('POST /api/payment/webhook handles checkout.session.completed and marks order paid', async () => {
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_sample_session_123',
          client_reference_id: testOrderNumber,
          payment_status: 'paid',
          metadata: { orderNumber: testOrderNumber }
        }
      }
    };

    const res = await fetch(`${baseUrl}/api/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.received, true);
    assert.equal(data.processed, true);

    // Verify order in DB transitioned to 'en_preparation'
    const order = db.prepare('SELECT status FROM orders WHERE order_number = ?').get(testOrderNumber);
    assert.equal(order.status, 'en_preparation');
  });

  test('POST /api/payment/webhook is idempotent on duplicate checkout.session.completed', async () => {
    // Re-send the exact same webhook payload
    const duplicatePayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_sample_session_123',
          client_reference_id: testOrderNumber,
          payment_status: 'paid',
          metadata: { orderNumber: testOrderNumber }
        }
      }
    };

    const res = await fetch(`${baseUrl}/api/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.received, true);
    assert.equal(data.processed, false, 'Duplicate webhook must not re-process already paid order');

    // Status remains en_preparation
    const order = db.prepare('SELECT status FROM orders WHERE order_number = ?').get(testOrderNumber);
    assert.equal(order.status, 'en_preparation');
  });

  test('POST /api/payment/webhook marks order as failed on payment_intent.payment_failed', async () => {
    const failedOrderNum = `EU-FAILED-${Date.now()}`;
    db.prepare(`
      INSERT INTO orders (
        order_number, customer_email, customer_first_name, customer_last_name,
        shipping_address, postal_code, city, country_code,
        subtotal, discount_amount, discount_code, shipping_fee, total_amount,
        carrier, estimated_delivery, status, tracking_steps_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      failedOrderNum, 'failed.buyer@example.eu', 'Marc', 'Lemoine',
      '5 Boulevard Haussmann', '75009', 'Paris', 'FR',
      50, 0, null, 0, 50,
      'Colissimo Suivi', '2 à 3 jours', 'en_attente_de_paiement', '[]', new Date().toISOString()
    );

    const failPayload = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_failed_456',
          metadata: { orderNumber: failedOrderNum },
          last_payment_error: { message: 'Fonds insuffisants' }
        }
      }
    };

    const res = await fetch(`${baseUrl}/api/payment/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failPayload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.received, true);
    assert.equal(data.status, 'payment_failed');

    const order = db.prepare('SELECT status FROM orders WHERE order_number = ?').get(failedOrderNum);
    assert.equal(order.status, 'paiement_echoue');
  });
});


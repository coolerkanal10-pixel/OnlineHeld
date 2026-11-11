// Stripe Checkout Integration for the 27$ Starter-Kit
// Uses Stripe REST API directly (no SDK needed for this flow)
const https = require('https');
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_ENABLED = !!STRIPE_SECRET;
const PRODUCT_PRICE_CENTS = 2700; // 27$
const PRODUCT_NAME = 'Online Business Starter-Kit';
const PRODUCT_DESC = '7-Tage-Challenge Plan, Fehler-Checklist, Content-Plan, E-Mail-Plan, Gewinn-Tracker, Skalierungs-Plan, Digitale Produkte Guide';

function readJSON(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } }
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8'); }

// Low-level Stripe API call
function stripeRequest(method, endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const options = {
      hostname: 'api.stripe.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ error: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Create a Checkout Session
async function createCheckoutSession(customerEmail, source = 'website') {
  if (!STRIPE_ENABLED) {
    return { ok: false, error: 'Stripe nicht konfiguriert. Setze STRIPE_SECRET_KEY Env-Variable.' };
  }
  try {
    const params = {
      'payment_method_types[]': 'card',
      'line_items[0][price_data[product_name]': PRODUCT_NAME,
      'line_items[0][price_data[currency]': 'usd',
      'line_items[0][price_data[unit_amount]': PRODUCT_PRICE_CENTS,
      'line_items[0][quantity]': '1',
      'line_items[0][description]': PRODUCT_DESC,
      'mode': 'payment',
      'customer_email': customerEmail,
      'success_url': 'https://skalierbar.local/success?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url': 'https://skalierbar.local/produkt.html',
      'metadata[source]': source,
    };
    const session = await stripeRequest('POST', '/v1/checkout/sessions', params);
    if (session.error) return { ok: false, error: session.error.message || JSON.stringify(session.error) };
    return { ok: true, sessionId: session.id, url: session.url };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Verify a Checkout Session (called from success page)
async function verifySession(sessionId) {
  if (!STRIPE_ENABLED) return { ok: false, error: 'Stripe nicht konfiguriert' };
  try {
    const session = await stripeRequest('GET', `/v1/checkout/sessions/${sessionId}`);
    if (session.error) return { ok: false, error: session.error.message };
    const paid = session.payment_status === 'paid';
    return { ok: true, paid, email: session.customer_email, amount: session.amount_total, currency: session.currency };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Record a sale
function recordSale(email, sessionId, amount, source = 'website') {
  const sales = readJSON(path.join(DATA_DIR, 'sales.json'));
  const sale = {
    id: 'sale_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    email,
    sessionId,
    amount: amount / 100,
    currency: 'usd',
    source,
    product: PRODUCT_NAME,
    createdAt: new Date().toISOString(),
    status: 'completed',
  };
  sales.push(sale);
  writeJSON(path.join(DATA_DIR, 'sales.json'), sales);
  return sale;
}

// Fulfillment: generate the Starter-Kit PDF (text-based, then served)
function generateKitPDF() {
  const kitPath = path.join(DATA_DIR, 'starter-kit.pdf');
  if (fs.existsSync(kitPath)) return kitPath;
  // Simple PDF-like text file served as download
  const content = `ONLINE BUSINESS STARTER-KIT
====================================
Dein kompletter Einstieg — 27$

INHALT:
1. 7-Tage-Challenge Plan — Tag für Tag
2. Die 5 größten Fehler-Checklist
3. Content-Plan Template (3 Artikel/Woche)
4. E-Mail-Plan Template (1 E-Mail/Woche)
5. Gewinn-Tracker Excel-Vorlage
6. Skalierungs-Plan (3 Strategien)
7. Digitale Produkte Guide (4 Produktarten)

DER WEG:
Tag 1: Nische + Domain
Tag 2: E-Mail-Liste + Lead-Magnet
Tag 3-5: Content (3 Artikel)
Tag 6: Teilen in Communities
Tag 7: Erstes Produkt (27$)

DAS ZIEL:
Dieses Starter-Kit ist der Funnel. Wenn du konsequent bleibst,
kann aus diesem Fundament ein Geschäft werden, das 200$/Tag generiert.

Keine Garantie für Einnahmen. Realistische Erwartungen.
Skalierbar — 2026
`;
  fs.writeFileSync(kitPath, content, 'utf8');
  return kitPath;
}

module.exports = {
  STRIPE_ENABLED,
  PRODUCT_PRICE_CENTS,
  PRODUCT_NAME,
  createCheckoutSession,
  verifySession,
  recordSale,
  generateKitPDF,
};
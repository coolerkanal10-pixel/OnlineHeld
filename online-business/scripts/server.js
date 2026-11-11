const http = require('http');
const fs = require('fs');
const path = require('path');
const stripe = require('./stripe.js');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure data dir + files
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SUBSCRIBERS_FILE)) fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) resolve(JSON.parse(body || '{}'));
        else {
          const params = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of params) obj[k] = v;
          resolve(obj);
        }
      } catch { resolve({}); }
    });
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  const siteDir = path.join(__dirname, '..', 'site');
  let filePath = path.join(siteDir, req.url === '/' ? 'index.html' : req.url);
  // Remove query string
  filePath = filePath.split('?')[0];
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API routes
  if (req.method === 'POST' && url.pathname === '/api/create-checkout') {
    const data = await parseBody(req);
    const email = (data.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJSON(res, 400, { ok: false, error: 'Ungültige E-Mail-Adresse' });
    }
    const result = await stripe.createCheckoutSession(email, data.source || 'website');
    return sendJSON(res, result.ok ? 200 : 400, result);
  }

  if (req.method === 'GET' && url.pathname === '/api/verify-session') {
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return sendJSON(res, 400, { ok: false, error: 'Keine Session-ID' });
    const result = await stripe.verifySession(sessionId);
    if (result.ok && result.paid) {
      stripe.recordSale(result.email, sessionId, result.amount, 'website');
      stripe.generateKitPDF();
    }
    return sendJSON(res, 200, result);
  }

  if (req.method === 'GET' && url.pathname === '/api/sales') {
    const sales = readJSON(path.join(DATA_DIR, 'sales.json'));
    return sendJSON(res, 200, { sales, total: sales.reduce((s, a) => s + a.amount, 0) });
  }

  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const subscribers = readJSON(SUBSCRIBERS_FILE);
    const leads = readJSON(LEADS_FILE);
    const sales = readJSON(path.join(DATA_DIR, 'sales.json'));
    return sendJSON(res, 200, {
      subscribers: subscribers.length,
      active: subscribers.filter(s => s.status === 'active').length,
      leads: leads.length,
      recent: subscribers.slice(-5).reverse(),
      sales: sales.length,
      revenue: sales.reduce((s, a) => s + a.amount, 0),
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/subscribe') {
    const data = await parseBody(req);
    const email = (data.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJSON(res, 400, { ok: false, error: 'Ungültige E-Mail-Adresse' });
    }
    const subscribers = readJSON(SUBSCRIBERS_FILE);
    if (subscribers.some(s => s.email === email)) {
      return sendJSON(res, 200, { ok: true, message: 'Bist du bereits angemeldet!', already: true });
    }
    const entry = {
      email,
      source: data.source || 'website',
      leadMagnet: data.leadMagnet || '7-tage-challenge',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    subscribers.push(entry);
    writeJSON(SUBSCRIBERS_FILE, subscribers);

    // Log lead
    const leads = readJSON(LEADS_FILE);
    leads.push({ ...entry, type: 'subscribe' });
    writeJSON(LEADS_FILE, leads);

    return sendJSON(res, 200, { ok: true, message: 'Willkommen! Check dein E-Mail-Postfach für das Starter-Kit.', subscriber: entry });
  }

  if (req.method === 'POST' && url.pathname === '/api/lead') {
    const data = await parseBody(req);
    const leads = readJSON(LEADS_FILE);
    leads.push({
      email: (data.email || '').trim().toLowerCase(),
      source: data.source || 'website',
      leadMagnet: data.leadMagnet || '7-tage-challenge',
      createdAt: new Date().toISOString(),
      type: 'lead',
    });
    writeJSON(LEADS_FILE, leads);
    return sendJSON(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const subscribers = readJSON(SUBSCRIBERS_FILE);
    const leads = readJSON(LEADS_FILE);
    return sendJSON(res, 200, {
      subscribers: subscribers.length,
      active: subscribers.filter(s => s.status === 'active').length,
      leads: leads.length,
      recent: subscribers.slice(-5).reverse(),
    });
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
});
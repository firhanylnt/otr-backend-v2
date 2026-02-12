/**
 * Vercel Serverless Function - Entry point for NestJS API
 * All routes are rewritten to this handler via vercel.json
 */
let cachedApp = null;

async function getApp() {
  if (cachedApp) return cachedApp;
  const { createApp } = require('../dist/main');
  cachedApp = await createApp();
  return cachedApp;
}

module.exports = async (req, res) => {
  // Vercel rewrite sends destination path in req.url; original path is in ?__path= (see vercel.json)
  let raw = (req.url || req.path || '').trim();
  let path;
  let queryString = '';
  if (raw.includes('?')) {
    const idx = raw.indexOf('?');
    path = raw.slice(0, idx);
    queryString = raw.slice(idx + 1);
  } else {
    path = raw;
  }
  const params = new URLSearchParams(queryString);
  const originalPath = params.get('__path');
  if (originalPath != null && originalPath !== '') {
    path = originalPath.startsWith('/') ? originalPath : '/' + originalPath;
    params.delete('__path');
    queryString = params.toString();
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      path = new URL(path).pathname;
    } catch (_) {
      path = path.replace(/^https?:\/\/[^/]+/, '') || '/';
    }
  }
  path = (path || '/').replace(/\/+/g, '/') || '/';
  if (path !== '/api' && !path.startsWith('/api/')) {
    path = '/api' + (path === '/' ? '' : path);
  }
  req.url = queryString ? path + '?' + queryString : path;

  // Health check tanpa load Nest/DB — untuk cek apakah function jalan
  if (path === '/api/health' || path === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ status: 'ok', service: 'otr-api' }));
    return;
  }

  try {
    const app = await getApp();
    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (err) {
    console.error('[OTR API] Serverless function crash:', err?.message || err);
    console.error(err?.stack);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: 'FUNCTION_INVOCATION_FAILED',
      message: process.env.NODE_ENV === 'production' ? 'Server error' : (err?.message || String(err)),
    });
  }
};

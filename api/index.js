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
  let path = (req.url || req.path || '').split('?')[0];
  const query = (req.url || '').includes('?') ? (req.url || '').split('?')[1] : '';

  // Pastikan path untuk Nest selalu diawali /api (Nest pakai setGlobalPrefix('api'))
  if (path && !path.startsWith('/api')) {
    path = '/api' + (path === '/' ? '' : path);
    req.url = query ? path + '?' + query : path;
  }

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

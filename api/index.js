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

function wrapReq(origReq, overrides) {
  return new Proxy(origReq, {
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(overrides, prop)) return overrides[prop];
      return target[prop];
    },
  });
}

module.exports = async (req, res) => {
  let path;
  let queryString = '';
  const raw = String(req.url || req.path || '').trim();

  // 1) Full URL (e.g. Vercel sometimes passes original URL) -> use pathname
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const u = new URL(raw);
      path = u.pathname;
      queryString = u.search ? u.search.slice(1) : '';
    } catch (_) {
      path = raw.replace(/^https?:\/\/[^/]+/, '') || '/';
      const q = path.indexOf('?');
      if (q !== -1) {
        queryString = path.slice(q + 1);
        path = path.slice(0, q);
      }
    }
  } else {
    const q = raw.indexOf('?');
    if (q !== -1) {
      path = raw.slice(0, q);
      queryString = raw.slice(q + 1);
    } else {
      path = raw;
    }
  }

  // 2) Rewrite sends original path in __path (vercel.json: destination /api?__path=:path)
  const params = new URLSearchParams(queryString);
  const fromRewrite = params.get('__path');
  if (fromRewrite != null && fromRewrite !== '') {
    path = fromRewrite.startsWith('/') ? fromRewrite : '/' + fromRewrite;
    params.delete('__path');
    queryString = params.toString();
  }

  path = (path || '/').replace(/\/+/g, '/') || '/';
  if (path !== '/api' && !path.startsWith('/api/')) {
    path = '/api' + (path === '/' ? '' : path);
  }
  const fullUrl = queryString ? path + '?' + queryString : path;
  const method = (req.method || 'GET').toUpperCase();

  // Health check tanpa load Nest/DB
  if (path === '/api/health' || path === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ status: 'ok', service: 'otr-api' }));
    return;
  }

  const debugHeader = req.headers && (req.headers['x-debug-path'] === '1' || req.headers['x-debug-path'] === 'true');
  if (process.env.OTR_DEBUG === '1' || debugHeader) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ path, method, rawUrl: raw, fromRewrite: fromRewrite ?? null }));
    return;
  }

  const wrappedReq = wrapReq(req, { url: fullUrl, path, originalUrl: fullUrl, method });

  try {
    const app = await getApp();
    const expressApp = app.getHttpAdapter().getInstance();
    await new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      expressApp(wrappedReq, res);
      setImmediate(() => {
        if (res.writableEnded) resolve();
      });
    });
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

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
  try {
    const app = await getApp();
    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (err) {
    console.error('[OTR API] Serverless function crash:', err?.message || err);
    console.error(err?.stack);
    res.status(500).json({
      error: 'FUNCTION_INVOCATION_FAILED',
      message: process.env.NODE_ENV === 'production' ? 'Server error' : (err?.message || String(err)),
    });
  }
};

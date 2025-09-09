const express = require('express');
const router = express.Router();
const { getDriveSa } = require('../utils/driveSa');

let sharp = null;
try { sharp = require('sharp'); } catch (_) { /* optional */ }

function setCachingHeaders(res, meta) {
  if (meta && meta.modifiedTime) {
    res.setHeader('Last-Modified', new Date(meta.modifiedTime).toUTCString());
  }
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
}

// GET /img/:id - stream original asset
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('Missing file id');
    const drive = getDriveSa();
    if (!drive) return res.status(500).send('Drive not configured');

    // Metadata for headers
    let meta;
    try {
      const m = await drive.files.get({
        fileId: id,
        fields: 'id, name, mimeType, size, modifiedTime',
        supportsAllDrives: true
      });
      meta = m && m.data;
    } catch (e) {
      const status = (e && e.code) || (e && e.response && e.response.status);
      if (status === 404) return res.status(404).send('Not found');
      if (status === 403) return res.status(403).send('Forbidden');
      console.error('Drive meta error:', e && e.message);
      return res.status(500).send('Drive metadata failed');
    }

    if (meta && meta.mimeType) {
      res.setHeader('Content-Type', meta.mimeType);
    }
    setCachingHeaders(res, meta);

    const resp = await drive.files.get(
      { fileId: id, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    resp.data.on('error', err => {
      console.error('Drive stream error:', err && err.message);
      if (!res.headersSent) res.status(500).end('Stream error');
    });
    resp.data.pipe(res);
  } catch (e) {
    console.error('Image proxy /img error:', e && e.message);
    res.status(500).send('Internal error');
  }
});

// GET /img/:id/:w - resize to width and return WebP (if sharp installed)
router.get('/:id/:w', async (req, res) => {
  const id = req.params.id;
  let w = parseInt(req.params.w, 10);
  if (!Number.isFinite(w) || w <= 0) w = 800;
  w = Math.max(64, Math.min(w, 4096));
  try {
    const drive = getDriveSa();
    if (!drive) return res.status(500).send('Drive not configured');
    // Load metadata
    let meta;
    try {
      const m = await drive.files.get({
        fileId: id,
        fields: 'id, name, mimeType, size, modifiedTime',
        supportsAllDrives: true
      });
      meta = m && m.data;
    } catch (e) {
      const status = (e && e.code) || (e && e.response && e.response.status);
      if (status === 404) return res.status(404).send('Not found');
      if (status === 403) return res.status(403).send('Forbidden');
      console.error('Drive meta error:', e && e.message);
      return res.status(500).send('Drive metadata failed');
    }

    setCachingHeaders(res, meta);

    // If sharp not available, stream original
    if (!sharp) {
      if (meta && meta.mimeType) res.setHeader('Content-Type', meta.mimeType);
      const orig = await drive.files.get({ fileId: id, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
      return orig.data.pipe(res);
    }

    res.setHeader('Content-Type', 'image/webp');
    const resp = await drive.files.get(
      { fileId: id, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    const transformer = sharp().resize({ width: w }).toFormat('webp', { quality: 82 });
    resp.data.on('error', err => {
      console.error('Drive stream error:', err && err.message);
      if (!res.headersSent) res.status(500).end('Stream error');
    });
    resp.data.pipe(transformer).pipe(res);
  } catch (e) {
    console.error('Image resize /img/:id/:w error:', e && e.message);
    res.status(500).send('Internal error');
  }
});

module.exports = router;


// routes/public.js
const express = require('express');
const router = express.Router();
const googleAPI = require('../config/google');

// Homepage -> anasayfa (full HTML, no layout)
router.get('/', async (req, res) => {
  const properties = await googleAPI.getProperties();
  // Sort by createdAt (desc), fallback to ilanId (timestamp) desc
  const getStamp = (p) => {
    if (p.createdAt) {
      const t = Date.parse(p.createdAt);
      if (!Number.isNaN(t)) return t;
    }
    const idNum = parseInt(p.ilanId, 10);
    return Number.isNaN(idNum) ? 0 : idNum;
  };
  const featuredProperties = [...properties]
    .sort((a, b) => getStamp(b) - getStamp(a))
    .slice(0, 6);

  res.render('anasayfa', {
    title: 'Emlak Uzmanınız',
    properties: featuredProperties,
    layout: false
  });
});

// Properties page
router.get('/properties', async (req, res) => {
  let properties = await googleAPI.getProperties();
  
  // Apply filters
  const { price_min, price_max, propertyType, rooms } = req.query;
  
  if (price_min) {
    properties = properties.filter(p => parseInt(p.price) >= parseInt(price_min));
  }
  if (price_max) {
    properties = properties.filter(p => parseInt(p.price) <= parseInt(price_max));
  }
  if (propertyType) {
    properties = properties.filter(p => p.propertyType === propertyType);
  }
  if (rooms) {
    properties = properties.filter(p => p.ilanOda === rooms);
  }
  
  res.render('properties', { 
    title: 'İlanlar',
    properties,
    filters: req.query,
    layout: false
  });
});

// Legacy property detail -> redirect to new design
router.get('/property/:id', async (req, res) => {
  const { id } = req.params;
  return res.redirect(302, `/propertyinfo/${id}`);
});

// Property Info (Tailwind design) - dynamic by ilanId
router.get('/propertyinfo/:id', async (req, res) => {
  try {
    const properties = await googleAPI.getProperties();
    const property = properties.find(p => p.ilanId === req.params.id);
    if (!property) {
      return res.status(404).send('İlan Bulunamadı');
    }

    if (property.photoIds) {
      const ids = property.photoIds.split(',').map(id => id.trim()).filter(Boolean);
      property.photos = ids.map(id => `/img/${id}`);
    } else {
      property.photos = [];
    }

    // Render without layout; this EJS has its own HTML skeleton
    return res.render('propertyinfo', { title: property.ilanBaslik, property, layout: false });
  } catch (e) {
    console.error('propertyinfo route error:', e);
    return res.status(500).send('Sunucu Hatası');
  }
});

// Redirect to the most recently added active property
router.get('/property/latest', async (req, res) => {
  try {
    const fresh = req.query.nocache === '1';
    let properties = fresh ? await googleAPI.getPropertiesFresh() : await googleAPI.getProperties();
    if (!properties || properties.length === 0) {
      return res.status(404).render('404', { title: 'İlan Bulunamadı' });
    }
    // Prefer createdAt if available; fallback to last in list
    const withDates = properties.filter(p => p.createdAt);
    let latest;
    if (withDates.length > 0) {
      latest = withDates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    } else {
      latest = properties[properties.length - 1];
    }
    return res.redirect(`/propertyinfo/${latest.ilanId}`);
  } catch (e) {
    console.error('Failed to resolve latest property:', e);
    return res.status(500).send('Sunucu Hatası');
  }
});

// Maps page
router.get('/maps', async (req, res) => {
  const properties = await googleAPI.getProperties();
  const mapProperties = properties.filter(p => p.latitude && p.longitude);
  
  res.render('maps', { 
    title: 'Haritalar',
    properties: mapProperties
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'İletişim', success: req.query.success, error: req.query.error, layout: false });
});

// Temporary landing page preview (no layout)
router.get('/anasayfa', async (req, res) => {
  // Render standalone to avoid double HTML when using express-ejs-layouts
  try {
    const properties = await googleAPI.getProperties();
    const getStamp = (p) => {
      if (p.createdAt) {
        const t = Date.parse(p.createdAt);
        if (!Number.isNaN(t)) return t;
      }
      const idNum = parseInt(p.ilanId, 10);
      return Number.isNaN(idNum) ? 0 : idNum;
    };
    const featured = [...properties]
      .sort((a, b) => getStamp(b) - getStamp(a))
      .slice(0, 6);
    res.render('anasayfa', { title: 'Anasayfa', layout: false, properties: featured });
  } catch (e) {
    console.error('anasayfa fetch error:', e);
    res.render('anasayfa', { title: 'Anasayfa', layout: false, properties: [] });
  }
});

// Contact form submission
const { sendContactEmail } = require('../utils/mailer');
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.redirect('/contact?error=Eksik%20bilgi');
    }

    const result = await sendContactEmail({ name, email, phone, subject, message });
    if (!result.ok) {
      console.error('Contact email error:', result.error);
      return res.redirect('/contact?error=E-posta%20g%C3%B6nderilemedi');
    }
    return res.redirect('/contact?success=1');
  } catch (e) {
    console.error('Contact form handling failed:', e);
    return res.redirect('/contact?error=Beklenmedik%20hata');
  }
});

module.exports = router;

// Legacy /image/* route is removed; use /img/* implemented with service account in routes/images.js

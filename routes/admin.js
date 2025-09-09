
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const googleAPI = require('../config/google');
const credentials = require('../credentials.json');
// Google Drive OAuth start
router.get('/google/auth', requireAuth, (req, res) => {
  const url = googleAPI.getDriveAuthUrl();
  return res.redirect(url);
});

// Google Drive OAuth callback
router.get('/google/oauth2callback', requireAuth, async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      console.error('Drive OAuth error:', error);
      return res.redirect('/admin?drive_auth=error');
    }
    if (!code) {
      return res.redirect('/admin?drive_auth=missing_code');
    }
    await googleAPI.handleDriveOAuthCallback(code);
    return res.redirect('/admin?drive_auth=success');
  } catch (e) {
    console.error('Drive OAuth callback failed:', e);
    return res.redirect('/admin?drive_auth=fail');
  }
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin Girişi', error: null, layout: false });
});

// Admin login POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { 
      title: 'Admin Girişi', 
      error: 'Kullanıcı adı veya şifre hatalı!',
      layout: false
    });
  }
});

// Admin dashboard
router.get('/', requireAuth, async (req, res) => {
  const properties = await googleAPI.getProperties();
  const stats = {
    totalProperties: properties.length,
    activeProperties: properties.filter(p => p.status === 'active').length,
    soldProperties: properties.filter(p => p.status === 'sold').length
  };
  
  res.render('admin/dashboard', { 
    title: 'Admin Paneli',
    stats,
    recentProperties: properties.slice(0, 5),
    driveAuthorized: googleAPI.isDriveAuthorized(),
    layout: false
  });
});

// Properties management
router.get('/properties', requireAuth, async (req, res) => {
  const properties = await googleAPI.getProperties();
  res.render('admin/properties', { 
    title: 'İlan Yönetimi',
    properties,
    success: req.query.success,
    error: req.query.error,
    updated: req.query.updated,
    layout: false
  });
});

// Add property page
router.get('/property/add', requireAuth, (req, res) => {
  res.render('admin/property-form', { 
    title: 'Yeni İlan Ekle',
    property: null,
    action: 'add',
    layout: false
  });
});

// Add property POST
router.post('/property/add', requireAuth, upload.array('photos', 10), async (req, res) => {
  try {
    // Debug logs for environment and service account details
    console.log('Service account client_email:', credentials && credentials.client_email ? credentials.client_email : '(not found)');
    console.log('GOOGLE_DRIVE_FOLDER_ID env:', process.env.GOOGLE_DRIVE_FOLDER_ID || '(undefined)');

    console.log('Property data received:', req.body);
    console.log('Files received:', req.files ? req.files.length : 0);
    
    const propertyData = req.body;
    
    // Upload photos to Google Drive
    if (req.files && req.files.length > 0) {
      console.log('Processing photos...');
      const photoIds = [];
      for (const file of req.files) {
        console.log('Processing file:', file.originalname, 'Size:', file.size);
        const fileName = `property_${Date.now()}_${file.originalname}`;
        const photoId = await googleAPI.uploadPhoto(file.buffer, fileName);
        console.log('Photo ID returned:', photoId);
        if (photoId) photoIds.push(photoId);
      }
      propertyData.photoIds = photoIds.join(',');
      console.log('All photo IDs:', propertyData.photoIds);
    } else {
      console.log('No files received');
    }
    
    const success = await googleAPI.addProperty(propertyData);
    console.log('Property added successfully:', success);
    
    if (success) {
      res.redirect('/admin/properties?success=1');
    } else {
      res.redirect('/admin/property/add?error=1');
    }
  } catch (error) {
    console.error('Error adding property:', error);
    res.redirect('/admin/property/add?error=1');
  }
});

// Edit property page
router.get('/property/edit/:id', requireAuth, async (req, res) => {
  const ilanId = req.params.id;
  const properties = await googleAPI.getPropertiesFresh();
  const property = properties.find(p => p.ilanId === ilanId);
  if (!property) {
    return res.redirect('/admin/properties?notfound=1');
  }
  res.render('admin/property-form', {
    title: 'İlan Düzenle',
    property,
    action: 'edit',
    layout: false
  });
});

// Edit property POST
router.post('/property/edit/:id', requireAuth, upload.array('photos', 10), async (req, res) => {
  try {
    const ilanId = req.params.id;
    const properties = await googleAPI.getPropertiesFresh();
    const existing = properties.find(p => p.ilanId === ilanId);
    if (!existing) {
      return res.redirect('/admin/properties?notfound=1');
    }

    const data = {
      ilanBaslik: req.body.ilanBaslik,
      ilanAciklama: req.body.ilanAciklama,
      price: req.body.price,
      ilanOda: req.body.ilanOda,
      ilanBanyo: req.body.ilanBanyo,
      ilanBoyut: req.body.ilanBoyut,
      propertyType: req.body.propertyType,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      status: existing.status
    };

    let photoIdsCombined = existing.photoIds || '';
    if (req.files && req.files.length > 0) {
      const newPhotoIds = [];
      for (const file of req.files) {
        const fileName = `property_${Date.now()}_${file.originalname}`;
        const photoId = await googleAPI.uploadPhoto(file.buffer, fileName);
        if (photoId) newPhotoIds.push(photoId);
      }
      if (newPhotoIds.length > 0) {
        photoIdsCombined = photoIdsCombined ? `${photoIdsCombined},${newPhotoIds.join(',')}` : newPhotoIds.join(',');
      }
    }
    data.photoIds = photoIdsCombined;

    const ok = await googleAPI.updatePropertyById(ilanId, data);
    if (!ok) {
      return res.redirect('/admin/properties?update=0');
    }
    return res.redirect('/admin/properties?updated=1');
  } catch (error) {
    console.error('Error updating property:', error);
    return res.redirect('/admin/properties?update=0');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;

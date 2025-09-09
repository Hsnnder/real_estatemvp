// package.json

  
  // server.js
  const express = require('express');
  const session = require('express-session');
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const helmet = require('helmet');
  const cors = require('cors');
  const path = require('path');
  const expressLayouts = require('express-ejs-layouts');
  require('dotenv').config();
  
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Middleware
  // Helmet defaults can block cross-origin CDN CSS/JS (COEP).
  // Soften policies to ensure Bootstrap/FontAwesome/Tailwind load reliably.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.static('public', { maxAge: '1d', etag: true }));
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'real-estate-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));
  
  // View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  if (process.env.NODE_ENV === 'production') {
    app.set('view cache', true);
  }
  app.disable('x-powered-by');
  
  // Layout middleware
  app.use(expressLayouts);
  app.set('layout', 'layout');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
  
  // Routes
  const publicRoutes = require('./routes/public');
  const adminRoutes = require('./routes/admin');
  const apiRoutes = require('./routes/api');
  
  app.use('/', publicRoutes);
  app.use('/admin', adminRoutes);
  app.use('/api', apiRoutes);

  
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  
  
 
  
  
 
  
  

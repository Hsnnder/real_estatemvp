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
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://husnuonde7_db_user:<kbdy1268>@cluster0.uoujte6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Middleware
  app.use(helmet({
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


  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
  
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  
  
 
  
  
 
  
  

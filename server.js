const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
const propertyRoutes = require('./routes/properties');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');

app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes(io));
app.use('/api/contact', contactRoutes);

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Admin page - redirect to login if not authenticated
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Create necessary directories
const initializeApp = async () => {
  try {
    await fs.mkdir('data', { recursive: true });
    await fs.mkdir('uploads/properties', { recursive: true });
    
    // Initialize properties.json if it doesn't exist
    try {
      await fs.access('data/properties.json');
    } catch {
      const initialData = {
        properties: [
          {
            id: "1",
            title: "Modern Lüks Daire - Beylikdüzü",
            description: "Deniz manzaralı, yeni yapım, lüks daire. Güvenlikli site içerisinde, yüzme havuzu ve fitness center mevcut.",
            price: 850000,
            rooms: 3,
            bathrooms: 2,
            squareMeters: 120,
            images: ["https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg"],
            createdAt: new Date().toISOString(),
            isActive: true
          },
          {
            id: "2", 
            title: "Satılık Villa - Büyükçekmece",
            description: "Müstakil villa, bahçeli, kapalı garajlı. Sakin bir mahallede, doğa ile iç içe.",
            price: 1200000,
            rooms: 4,
            bathrooms: 3,
            squareMeters: 200,
            images: ["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg"],
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ]
      };
      await fs.writeFile('data/properties.json', JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
};

initializeApp();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/login`);
  console.log(`Admin credentials: admin / emlak123`);
});

module.exports = { app, io };

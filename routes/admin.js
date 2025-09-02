const express = require('express');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const upload = require('../middleware/upload');
const { authenticate, generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
        }
        
        if (authenticate(username, password)) {
            const token = generateToken(username);
            res.json({ 
                message: 'Giriş başarılı',
                token: token,
                username: username
            });
        } else {
            res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş sırasında hata oluştu' });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.json({ message: 'Çıkış başarılı' });
});

// Tüm admin rotaları artık authentication gerektiriyor
router.use(requireAuth);

// Get all properties (including inactive)
router.get('/properties', async (req, res) => {
    try {
        const data = await fs.readFile('data/properties.json', 'utf8');
        const properties = JSON.parse(data);
        res.json(properties.properties);
    } catch (error) {
        console.error('Error reading properties:', error);
        res.status(500).json({ error: 'Özellikler yüklenirken hata oluştu' });
    }
});

// Add new property
router.post('/properties', upload.array('images', 10), async (req, res) => {
    try {
        const { title, description, price, rooms, bathrooms, squareMeters } = req.body;
        
        // Process uploaded images
        const imageUrls = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];
        
        const newProperty = {
            id: uuidv4(),
            title,
            description,
            price: parseInt(price),
            rooms: parseInt(rooms),
            bathrooms: parseInt(bathrooms),
            squareMeters: parseInt(squareMeters),
            images: imageUrls,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Read current properties
        const data = await fs.readFile('data/properties.json', 'utf8');
        const properties = JSON.parse(data);
        
        // Add new property
        properties.properties.push(newProperty);
        
        // Save to file
        await fs.writeFile('data/properties.json', JSON.stringify(properties, null, 2));
        
        // Emit real-time update
        req.app.get('io').emit('propertyAdded', newProperty);
        
        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ error: 'Özellik eklenirken hata oluştu' });
    }
});

// Update property
router.put('/properties/:id', async (req, res) => {
    try {
        const { title, description, price, rooms, bathrooms, squareMeters, isActive } = req.body;
        
        const data = await fs.readFile('data/properties.json', 'utf8');
        const properties = JSON.parse(data);
        
        const propertyIndex = properties.properties.findIndex(p => p.id === req.params.id);
        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Özellik bulunamadı' });
        }
        
        // Update property
        properties.properties[propertyIndex] = {
            ...properties.properties[propertyIndex],
            title,
            description,
            price: parseInt(price),
            rooms: parseInt(rooms),
            bathrooms: parseInt(bathrooms),
            squareMeters: parseInt(squareMeters),
            isActive: isActive !== undefined ? isActive : properties.properties[propertyIndex].isActive
        };
        
        await fs.writeFile('data/properties.json', JSON.stringify(properties, null, 2));
        
        // Emit real-time update
        req.app.get('io').emit('propertyUpdated', properties.properties[propertyIndex]);
        
        res.json(properties.properties[propertyIndex]);
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Özellik güncellenirken hata oluştu' });
    }
});

// Delete property
router.delete('/properties/:id', async (req, res) => {
    try {
        const data = await fs.readFile('data/properties.json', 'utf8');
        const properties = JSON.parse(data);
        
        const propertyIndex = properties.properties.findIndex(p => p.id === req.params.id);
        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Özellik bulunamadı' });
        }
        
        const deletedProperty = properties.properties[propertyIndex];
        properties.properties.splice(propertyIndex, 1);
        
        await fs.writeFile('data/properties.json', JSON.stringify(properties, null, 2));
        
        // Emit real-time update
        req.app.get('io').emit('propertyDeleted', deletedProperty.id);
        
        res.json({ message: 'Özellik başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Özellik silinirken hata oluştu' });
    }
});

module.exports = (io) => {
    return router;
};

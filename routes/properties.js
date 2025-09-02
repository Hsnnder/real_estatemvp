const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Get all active properties
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile('data/properties.json', 'utf8');
    const properties = JSON.parse(data);
    const activeProperties = properties.properties.filter(p => p.isActive);
    res.json(activeProperties);
  } catch (error) {
    console.error('Error reading properties:', error);
    res.status(500).json({ error: 'Özellikler yüklenirken hata oluştu' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile('data/properties.json', 'utf8');
    const properties = JSON.parse(data);
    const property = properties.properties.find(p => p.id === req.params.id && p.isActive);
    
    if (!property) {
      return res.status(404).json({ error: 'Özellik bulunamadı' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error reading property:', error);
    res.status(500).json({ error: 'Özellik yüklenirken hata oluştu' });
  }
});

module.exports = router;
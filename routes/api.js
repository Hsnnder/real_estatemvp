const express = require('express');
  const router = express.Router();
  const googleAPI = require('../config/google');
  
  // Get all properties
  router.get('/properties', async (req, res) => {
    try {
      const properties = await googleAPI.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });
  
  // Get single property
  router.get('/property/:id', async (req, res) => {
    try {
      const properties = await googleAPI.getProperties();
      const property = properties.find(p => p.ilanId === req.params.id);
      
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch property' });
    }
  });
  
  // Search properties
  router.get('/properties/search', async (req, res) => {
    try {
      let properties = await googleAPI.getProperties();
      
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
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search properties' });
    }
  });
  
  module.exports = router;
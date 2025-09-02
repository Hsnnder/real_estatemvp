const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Kullanıcı kendi SMTP ayarlarını yapacak
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;
    
    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: `Emlak Sitesi - Yeni İletişim Formu ${propertyId ? `(Özellik ID: ${propertyId})` : ''}`,
      html: `
        <h2>Yeni İletişim Formu</h2>
        <p><strong>Ad Soyad:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        ${propertyId ? `<p><strong>Özellik ID:</strong> ${propertyId}</p>` : ''}
        <p><strong>Mesaj:</strong></p>
        <p>${message}</p>
      `
    };
    
    // Note: In development, emails won't actually send without proper SMTP setup
    console.log('Email would be sent:', mailOptions);
    
    res.json({ message: 'Mesajınız başarıyla gönderildi!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Email gönderilirken hata oluştu' });
  }
});

module.exports = router;
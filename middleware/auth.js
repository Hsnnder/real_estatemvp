const jwt = require('jsonwebtoken');

// Basit JWT secret - production'da environment variable kullanın
const JWT_SECRET = 'emlak_admin_secret_key_2024';

// Admin credentials - production'da veritabanından alınmalı
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'emlak123' // Bu şifreyi değiştirebilirsiniz
};

// Token oluştur
const generateToken = (username) => {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
};

// Token doğrula
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Login fonksiyonu
const authenticate = (username, password) => {
    return username === ADMIN_CREDENTIALS.username && 
           password === ADMIN_CREDENTIALS.password;
};

// Middleware - admin rotalarını korur
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.body.token || 
                  req.query.token;

    if (!token) {
        return res.status(401).json({ error: 'Erişim token\'ı gerekli' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Geçersiz token' });
    }

    req.user = decoded;
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    requireAuth
};

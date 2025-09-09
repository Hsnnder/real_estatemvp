 // middleware/auth.js
 const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
      next();
    } else {
      res.redirect('/admin/login');
    }
  };
  
  module.exports = { requireAuth };
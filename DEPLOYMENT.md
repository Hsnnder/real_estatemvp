# Deployment Guide - Emlak Uzmanınız

## Quick Deploy Options

### 1. Vercel (Recommended - Easiest)

1. **Prepare your project**
   ```bash
   # Make sure all files are committed
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Import your repository
   - Add environment variables in Vercel dashboard:
     ```
     PORT=3000
     SESSION_SECRET=your-super-secret-session-key-here
     GOOGLE_SHEET_ID=your-google-sheet-id
     GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
     GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
     GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
     GOOGLE_OAUTH_REDIRECT_URI=https://your-app.vercel.app/admin/google/oauth2callback
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=your-admin-password
     GOOGLE_API_KEY=your-google-maps-api-key
     ```
   - Deploy!

3. **Update OAuth Redirect URI**
   - In Google Cloud Console, update the redirect URI to your Vercel URL
   - Update `GOOGLE_OAUTH_REDIRECT_URI` in Vercel environment variables

### 2. Railway

1. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create new project from GitHub repo

2. **Add Environment Variables**
   - In Railway dashboard, add all variables from `.env`
   - Update `GOOGLE_OAUTH_REDIRECT_URI` to your Railway URL

3. **Deploy**
   - Railway automatically detects Node.js and deploys

### 3. Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Connect GitHub repository
   - Choose "Web Service"
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   - Add all variables from `.env`
   - Update redirect URI to your Render URL

### 4. Heroku

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI from heroku.com
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set SESSION_SECRET=your-secret
   heroku config:set GOOGLE_SHEET_ID=your-sheet-id
   # ... add all other variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All sensitive files in `.gitignore`
- [ ] `credentials.json` not in repository
- [ ] Environment variables documented
- [ ] README.md updated
- [ ] All features tested locally

### ✅ Google APIs Setup
- [ ] Google Cloud project created
- [ ] APIs enabled (Sheets, Drive, Maps)
- [ ] Service account created and JSON downloaded
- [ ] OAuth2 credentials created
- [ ] Google Sheet shared with service account
- [ ] Google Drive folder created and ID copied

### ✅ Environment Variables
- [ ] All required variables documented
- [ ] Production URLs updated
- [ ] Strong passwords/secrets generated
- [ ] OAuth redirect URI matches deployment URL

### ✅ Security
- [ ] Admin credentials are strong
- [ ] Session secret is random and long
- [ ] No sensitive data in code
- [ ] HTTPS enabled (most platforms do this automatically)

## Post-Deployment Steps

1. **Test the Application**
   - Visit your deployed URL
   - Test admin login
   - Test property creation
   - Test image uploads

2. **Update Google OAuth**
   - Update redirect URI in Google Cloud Console
   - Update environment variable in hosting platform

3. **Monitor Performance**
   - Check application logs
   - Monitor Google API quotas
   - Test on mobile devices

## Environment Variables Reference

```env
# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here

# Google Sheets
GOOGLE_SHEET_ID=your-google-sheet-id

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id

# Google OAuth2 (for Drive uploads)
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/admin/google/oauth2callback

# Admin Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Google Maps (optional)
GOOGLE_API_KEY=your-google-maps-api-key
```

## Troubleshooting Deployment

### Common Issues

1. **Build Fails**
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`
   - Check for syntax errors

2. **Environment Variables Not Working**
   - Verify variable names match exactly
   - Check for typos in values
   - Restart the application after adding variables

3. **Google APIs Not Working**
   - Verify API keys are correct
   - Check API quotas and billing
   - Ensure redirect URI matches exactly

4. **Images Not Loading**
   - Check Google Drive permissions
   - Verify OAuth2 authorization completed
   - Check CORS settings

### Getting Help

- Check hosting platform logs
- Test locally with production environment variables
- Verify Google Cloud Console settings
- Check browser developer tools for errors

## Cost Considerations

### Free Tiers Available
- **Vercel**: Free tier with generous limits
- **Railway**: $5/month after free trial
- **Render**: Free tier available
- **Heroku**: No longer free, starts at $7/month

### Google APIs Costs
- **Google Sheets API**: Free (with limits)
- **Google Drive API**: Free (with limits)
- **Google Maps API**: Pay-per-use (free tier available)

### Recommended for Production
- **Vercel** for ease of use and free tier
- **Railway** for more control and reasonable pricing
- **DigitalOcean** for full server control

## Next Steps After Deployment

1. **Set up monitoring** (optional)
2. **Configure custom domain** (if desired)
3. **Set up automated backups** of Google Sheets
4. **Add SSL certificate** (usually automatic)
5. **Configure CDN** for better performance (optional)

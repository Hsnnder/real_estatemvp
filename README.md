# Emlak Uzmanınız - Real Estate Website

Modern, responsive real estate website with admin panel for property management.

## Features

- 🏠 Property listings with photo galleries
- 📱 Responsive design (mobile-friendly)
- 🔐 Admin panel for property management
- 📊 Google Sheets integration for data storage
- ☁️ Google Drive integration for photo storage
- 🗺️ Google Maps integration
- 🔍 Property search and filtering

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap 5, Font Awesome
- **Database**: Google Sheets API
- **File Storage**: Google Drive API
- **Authentication**: OAuth2 + Session-based

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Google Cloud Project with APIs enabled:
  - Google Sheets API
  - Google Drive API
- Google OAuth2 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realEstateDeneme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=3000
   SESSION_SECRET=your-super-secret-session-key-here
   
   # Google Sheets
   GOOGLE_SHEET_ID=your-google-sheet-id
   
   # Google Drive
   GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
   
   # Google OAuth2
   GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/admin/google/oauth2callback
   
   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-admin-password
   
   # Google Maps (optional)
   GOOGLE_API_KEY=your-google-maps-api-key
   ```

4. **Google Credentials Setup**
   - Place your service account JSON file as `credentials.json` in the root directory
   - Ensure the service account has access to your Google Sheet and Drive folder

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

6. **Access the application**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Deployment

### For Production Deployment

1. **Build the application**
   ```bash
   npm run build:prod
   ```

2. **Environment Variables**
   Update your production `.env` with production URLs:
   ```env
   GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/admin/google/oauth2callback
   ```

3. **Deploy to your hosting platform**
   - Ensure Node.js is supported
   - Set environment variables
   - Upload all files except `node_modules`
   - Run `npm install --production`
   - Start with `npm start`

### Recommended Hosting Platforms

- **Vercel**: Easy deployment with automatic builds
- **Heroku**: Simple Node.js deployment
- **DigitalOcean App Platform**: Managed Node.js hosting
- **Railway**: Modern deployment platform
- **Render**: Free tier available

## Project Structure

```
realEstateDeneme/
├── config/
│   └── google.js          # Google APIs configuration
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── admin.js           # Admin panel routes
│   ├── api.js             # API endpoints
│   └── public.js          # Public website routes
├── views/
│   ├── admin/             # Admin panel views
│   ├── index.ejs          # Homepage
│   ├── properties.ejs     # Property listings
│   ├── property-detail.ejs # Property detail page
│   └── layout.ejs         # Main layout template
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Google APIs Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
   - Google Maps JavaScript API (optional)

### 2. Service Account (for Sheets)

1. Go to IAM & Admin > Service Accounts
2. Create a new service account
3. Download the JSON key file as `credentials.json`
4. Share your Google Sheet with the service account email

### 3. OAuth2 Credentials (for Drive)

1. Go to APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:3000/admin/google/oauth2callback`
4. Download the JSON and extract client_id and client_secret

### 4. Google Drive Folder

1. Create a folder in Google Drive
2. Copy the folder ID from the URL
3. Set `GOOGLE_DRIVE_FOLDER_ID` in your `.env`

## Admin Panel Usage

1. **Login**: Go to `/admin` and login with your credentials
2. **Authorize Drive**: Click the authorization link on the dashboard
3. **Add Properties**: Use the "Yeni İlan Ekle" button
4. **Manage Properties**: View and manage all properties

## API Endpoints

### Public
- `GET /` - Homepage
- `GET /properties` - Property listings
- `GET /property/:id` - Property detail
- `GET /maps` - Maps page
- `GET /contact` - Contact page

### Admin
- `GET /admin` - Admin dashboard
- `GET /admin/properties` - Property management
- `GET /admin/property/add` - Add property form
- `POST /admin/property/add` - Create property
- `GET /admin/google/auth` - Start OAuth flow
- `GET /admin/google/oauth2callback` - OAuth callback

### API
- `GET /api/properties` - Get all properties (JSON)
- `GET /api/property/:id` - Get single property (JSON)
- `GET /api/properties/search` - Search properties (JSON)

## Troubleshooting

### Common Issues

1. **Images not loading**
   - Check Google Drive folder permissions
   - Verify OAuth2 authorization
   - Check browser console for CORS errors

2. **Google Sheets not updating**
   - Verify service account has access to the sheet
   - Check `GOOGLE_SHEET_ID` is correct

3. **OAuth2 errors**
   - Ensure redirect URI matches exactly
   - Check client ID and secret are correct
   - Verify OAuth consent screen is configured

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email info@emlakuzmaniniz.com or create an issue in the repository.

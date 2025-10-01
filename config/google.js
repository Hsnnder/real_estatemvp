const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Normalize status values from Sheet to a canonical set
function normalizeStatus(val) {
  const v = (val || '').toString().trim().toLowerCase();
  if (['active', 'aktif', 'on', '1', 'true'].includes(v)) return 'active';
  if (['sold', 'satildi', 'satıldı', 'closed', 'kapandi', 'kapandı'].includes(v)) return 'sold';
  if (['passive', 'pasif', 'inactive', 'off', '0', 'disabled'].includes(v)) return 'passive';
  // Default to active for empty/unknown
  return 'active';
}

class GoogleAPI {
  constructor() {
    // Service Account auth for Sheets
    // Prefer explicit env var, fallback to project-level authjson.json
    const saPath = process.env.GOOGLE_CREDENTIALS
      ? path.resolve(process.env.GOOGLE_CREDENTIALS)
      : '/Users/onderkabadayi/realEstateDeneme/authjson.json';
    let saCreds = null;
    try {
      const raw = fs.readFileSync(saPath, 'utf8');
      const json = JSON.parse(raw);
      if (!json || json.type !== 'service_account' || !json.private_key || !json.client_email) {
        throw new Error('Invalid service account JSON');
      }
      saCreds = {
        client_email: json.client_email,
        private_key: json.private_key,
        project_id: json.project_id
      };
      console.log(`Using service account for Sheets: ${saPath}`);
    } catch (e) {
      console.error('Failed to load service account for Sheets from', saPath, '-', e.message);
    }

    this.auth = new google.auth.GoogleAuth({
      credentials: saCreds || undefined,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ]
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });

    // OAuth2 client for Drive (user quota)
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    // Load tokens if present
    this.tokenPath = path.join(__dirname, 'token.json');
    this._loadTokenIfExists();
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    // Simple in-memory cache for Sheets data
    this._propertiesCache = { data: null, ts: 0 };
    this._allPropertiesCache = { data: null, ts: 0 };
    // Default to 0 (no cache) so changes reflect instantly unless explicitly enabled via env
    this._cacheTtlMs = parseInt(process.env.PROPERTIES_CACHE_TTL_MS || '0', 10);
  }

  _loadTokenIfExists() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const tokenRaw = fs.readFileSync(this.tokenPath, 'utf8');
        const token = JSON.parse(tokenRaw);
        this.oauth2Client.setCredentials(token);
        console.log('Drive OAuth token loaded');
      } else {
        console.log('Drive OAuth token not found; authorization required');
      }
    } catch (e) {
      console.error('Failed to load Drive OAuth token:', e.message);
    }
  }

  getDriveAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file'
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });
  }

  async handleDriveOAuthCallback(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2), 'utf8');
    console.log('Drive OAuth token stored');
    return true;
  }

  isDriveAuthorized() {
    try {
      const creds = this.oauth2Client && this.oauth2Client.credentials;
      return Boolean(creds && (creds.access_token || creds.refresh_token));
    } catch {
      return false;
    }
  }

  async getProperties() {
    try {
      // Serve from cache if fresh
      const now = Date.now();
      if (this._cacheTtlMs > 0 && this._propertiesCache.data && (now - this._propertiesCache.ts) < this._cacheTtlMs) {
        return this._propertiesCache.data;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N'
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];

      // Map by fixed columns to avoid header mismatches
      const properties = rows.slice(1).map(row => ({
        ilanId: row[0] || '',
        ilanBaslik: row[1] || '',
        ilanAciklama: row[2] || '',
        price: row[3] || '',
        ilanOda: row[4] || '',
        ilanBanyo: row[5] || '',
        ilanBoyut: row[6] || '',
        propertyType: row[7] || '',
        photoIds: row[8] || '',
        latitude: row[9] || '',
        longitude: row[10] || '',
        status: normalizeStatus(row[11] || ''),
        createdAt: row[12] || '',
        address: row[13] || ''
      }));

      const active = properties.filter(prop => prop.status === 'active');

      // Update cache
      if (this._cacheTtlMs > 0) {
        this._propertiesCache = { data: active, ts: now };
      }
      return active;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  // Fetch properties bypassing the cache (e.g., right after adding a new one)
  async getPropertiesFresh() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N'
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];

      const properties = rows.slice(1).map(row => ({
        ilanId: row[0] || '',
        ilanBaslik: row[1] || '',
        ilanAciklama: row[2] || '',
        price: row[3] || '',
        ilanOda: row[4] || '',
        ilanBanyo: row[5] || '',
        ilanBoyut: row[6] || '',
        propertyType: row[7] || '',
        photoIds: row[8] || '',
        latitude: row[9] || '',
        longitude: row[10] || '',
        status: normalizeStatus(row[11] || ''),
        createdAt: row[12] || '',
        address: row[13] || ''
      }));

      return properties.filter(prop => prop.status === 'active');
    } catch (error) {
      console.error('Error fetching fresh properties:', error);
      return [];
    }
  }

  // Get all properties regardless of status (for admin/stats)
  async getAllProperties() {
    try {
      const now = Date.now();
      if (this._cacheTtlMs > 0 && this._allPropertiesCache.data && (now - this._allPropertiesCache.ts) < this._cacheTtlMs) {
        return this._allPropertiesCache.data;
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N'
      });
      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];
      const properties = rows.slice(1).map(row => ({
        ilanId: row[0] || '',
        ilanBaslik: row[1] || '',
        ilanAciklama: row[2] || '',
        price: row[3] || '',
        ilanOda: row[4] || '',
        ilanBanyo: row[5] || '',
        ilanBoyut: row[6] || '',
        propertyType: row[7] || '',
        photoIds: row[8] || '',
        latitude: row[9] || '',
        longitude: row[10] || '',
        status: normalizeStatus(row[11] || ''),
        createdAt: row[12] || '',
        address: row[13] || ''
      }));
      if (this._cacheTtlMs > 0) {
        this._allPropertiesCache = { data: properties, ts: now };
      }
      return properties;
    } catch (error) {
      console.error('Error fetching all properties:', error);
      return [];
    }
  }

  // Fetch all properties bypassing the cache
  async getAllPropertiesFresh() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N'
      });
      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];
      const properties = rows.slice(1).map(row => ({
        ilanId: row[0] || '',
        ilanBaslik: row[1] || '',
        ilanAciklama: row[2] || '',
        price: row[3] || '',
        ilanOda: row[4] || '',
        ilanBanyo: row[5] || '',
        ilanBoyut: row[6] || '',
        propertyType: row[7] || '',
        photoIds: row[8] || '',
        latitude: row[9] || '',
        longitude: row[10] || '',
        status: normalizeStatus(row[11] || ''),
        createdAt: row[12] || '',
        address: row[13] || ''
      }));
      return properties;
    } catch (error) {
      console.error('Error fetching fresh all properties:', error);
      return [];
    }
  }

  async addProperty(propertyData) {
    try {
      const values = [
        [
          Date.now().toString(), // ilanId
          propertyData.ilanBaslik,
          propertyData.ilanAciklama,
          propertyData.price,
          propertyData.ilanOda,
          propertyData.ilanBanyo,
          propertyData.ilanBoyut,
          propertyData.propertyType,
          propertyData.photoIds || '',
          propertyData.latitude || '',
          propertyData.longitude || '',
          'active',
          new Date().toISOString(),
          propertyData.address || ''
        ]
      ];
  
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
      // Invalidate cache immediately after write
      this.invalidatePropertiesCache();
      return true;
    } catch (error) {
      console.error('Error adding property:', error);
      return false;
    }
  }

  // Update an existing property row by ilanId
  async updatePropertyById(ilanId, updates) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sayfa1!A:N'
      });
      const rows = response.data.values || [];
      if (rows.length < 2) return false;

      let idx = -1; // index in rows array
      for (let i = 1; i < rows.length; i++) {
        if ((rows[i][0] || '') === String(ilanId)) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return false;

      const existing = rows[idx] || [];
      const rowValues = [
        String(ilanId),
        updates.ilanBaslik ?? existing[1] ?? '',
        updates.ilanAciklama ?? existing[2] ?? '',
        updates.price ?? existing[3] ?? '',
        updates.ilanOda ?? existing[4] ?? '',
        updates.ilanBanyo ?? existing[5] ?? '',
        updates.ilanBoyut ?? existing[6] ?? '',
        updates.propertyType ?? existing[7] ?? '',
        updates.photoIds ?? existing[8] ?? '',
        updates.latitude ?? existing[9] ?? '',
        updates.longitude ?? existing[10] ?? '',
        updates.status ?? existing[11] ?? 'active',
        existing[12] || new Date().toISOString(),
        updates.address ?? existing[13] ?? ''
      ];

      const sheetRow = idx + 1; // 1-based row number in the sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sayfa1!A${sheetRow}:N${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [rowValues] }
      });

      // Invalidate cache after update
      this.invalidatePropertiesCache();
      return true;
    } catch (error) {
      console.error('Error updating property:', error);
      return false;
    }
  }

  async uploadPhoto(fileBuffer, fileName) {
    try {
      console.log('Starting photo upload:', fileName);
      console.log('File buffer size:', fileBuffer.length);
      console.log('Drive folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);

      // Ensure OAuth is authorized
      if (!this.oauth2Client || !this.oauth2Client.credentials || (!this.oauth2Client.credentials.access_token && !this.oauth2Client.credentials.refresh_token)) {
        console.error('Drive OAuth not authorized. Visit /admin/google/auth to authorize.');
        return null;
      }
      
      // Determine MIME type based on file extension
      const mimeType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 
                      fileName.toLowerCase().endsWith('.gif') ? 'image/gif' : 
                      'image/jpeg';
      
      console.log('MIME type:', mimeType);
      
      // Convert buffer to stream
      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      
      const parents = process.env.GOOGLE_DRIVE_FOLDER_ID && String(process.env.GOOGLE_DRIVE_FOLDER_ID).trim()
        ? [String(process.env.GOOGLE_DRIVE_FOLDER_ID).trim()]
        : undefined;
      let response;
      try {
        response = await this.drive.files.create({
          requestBody: {
            name: fileName,
            ...(parents ? { parents } : {})
          },
          media: {
            mimeType: mimeType,
            body: stream
          },
          supportsAllDrives: true
        });
      } catch (err) {
        // Retry without parents if folder invalid/missing
        const status = (err && err.code) || (err && err.response && err.response.status);
        if (parents && (status === 404 || status === 400)) {
          console.warn('Parent folder invalid. Retrying upload without parents...');
          response = await this.drive.files.create({
            requestBody: { name: fileName },
            media: { mimeType: mimeType, body: stream },
            supportsAllDrives: true
          });
        } else {
          throw err;
        }
      }

      console.log('File created successfully:', response.data.id);

      // Make file publicly viewable
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        },
        supportsAllDrives: true
      });

      console.log('File permissions set successfully');
      return response.data.id;
    } catch (error) {
      console.error('Error uploading photo:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return null;
    }
  }

  getPhotoUrl(fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  invalidatePropertiesCache() {
    this._propertiesCache = { data: null, ts: 0 };
    this._allPropertiesCache = { data: null, ts: 0 };
  }
}

module.exports = new GoogleAPI();

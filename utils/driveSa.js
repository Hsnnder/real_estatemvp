const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let drive = null;

function getDriveSa() {
  if (drive) return drive;
  const credPath = process.env.GOOGLE_CREDENTIALS;
  if (!credPath) {
    console.warn('GOOGLE_CREDENTIALS is not set; Drive SA disabled');
    return null;
  }
  try {
    const resolved = path.resolve(credPath);
    const raw = fs.readFileSync(resolved, 'utf8');
    const json = JSON.parse(raw);
    if (!json || json.type !== 'service_account' || !json.private_key || !json.client_email) {
      console.error('GOOGLE_CREDENTIALS must point to a Service Account JSON (type=service_account with private_key, client_email). Given file is not a SA key:', resolved);
      return null;
    }
    console.log(`Using service account JWT for Drive: ${resolved}`);
    // Use credentials object directly to avoid newline issues
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: json.client_email,
        private_key: json.private_key,
        project_id: json.project_id
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    drive = google.drive({ version: 'v3', auth });
    return drive;
  } catch (e) {
    console.error('Failed to initialize Drive SA:', e && e.message);
    return null;
  }
}

module.exports = { getDriveSa };

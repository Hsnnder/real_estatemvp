let transporter;
let _nodemailer;

function getTransporter() {
  if (transporter) return transporter;
  // Lazy-require nodemailer to avoid hard crash if not installed yet
  if (!_nodemailer) {
    try {
      // eslint-disable-next-line global-require
      _nodemailer = require('nodemailer');
    } catch (e) {
      console.warn('Nodemailer not installed. Run `npm i nodemailer` to enable email sending.');
      return null;
    }
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  transporter = _nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
}

async function sendContactEmail({ name, email, phone, subject, message }) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const to = process.env.EMAIL_TO || from;

  const t = getTransporter();
  if (!t) {
    return { ok: false, error: 'SMTP not configured' };
  }

  const mailOptions = {
    from,
    to,
    subject: `Yeni İletişim Formu: ${subject || 'Konu yok'} - ${name || 'İsimsiz'}`,
    text: `Ad Soyad: ${name}\nE-posta: ${email}\nTelefon: ${phone || '-'}\nKonu: ${subject}\n\nMesaj:\n${message}`,
    html: `
      <h3>Yeni İletişim Formu</h3>
      <p><strong>Ad Soyad:</strong> ${name}</p>
      <p><strong>E‑posta:</strong> ${email}</p>
      <p><strong>Telefon:</strong> ${phone || '-'}</p>
      <p><strong>Konu:</strong> ${subject}</p>
      <hr/>
      <p style="white-space:pre-wrap;">${(message || '').replace(/</g, '&lt;')}</p>
    `
  };

  try {
    await t.sendMail(mailOptions);
    return { ok: true };
  } catch (err) {
    console.error('Failed to send contact email:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendContactEmail };

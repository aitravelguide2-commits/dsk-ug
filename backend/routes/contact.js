import express from 'express';
import { sendGraphMail } from '../services/mail.js';

const router = express.Router();

// Simple rate limiting: store IPs and timestamps
const requestLog = new Map();

const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 5;

  const userRequests = requestLog.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({ success: false, msg: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' });
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  
  // Cleanup old entries periodically could be added here, but map size is likely manageable for this scale
  next();
};

router.post('/send', rateLimit, async (req, res) => {
  try {
    const { name, email, phone, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, msg: 'Bitte füllen Sie alle Pflichtfelder aus.' });
    }

    const targetEmail = process.env.MICROSOFT_MAIL_TO || 'mert.karaca@dsk-ug.de';
    
    const htmlContent = `
      <h2>Neue Kontaktanfrage</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>Telefon:</strong> ${phone || 'Nicht angegeben'}</p>
      <p><strong>Betreff:</strong> ${subject || 'Kontaktanfrage'}</p>
      <br>
      <h3>Nachricht:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    await sendGraphMail({
      to: targetEmail,
      subject: `Kontaktanfrage von ${name}: ${subject || 'Allgemein'}`,
      html: htmlContent
    });

    res.json({ success: true, msg: 'Nachricht erfolgreich gesendet.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, msg: 'Fehler beim Senden der Nachricht.', error: error.message });
  }
});

export default router;

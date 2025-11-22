import { Router } from 'express';
import auth from './auth.js';
import accommodations from './accommodations.js';
import bookings from './bookings.js';
import content from './content.js';
import dashboard from './dashboard.js';
import catalog from './catalog.js';
import mail from './mail.js';
import uploads from './uploads.js';
import ai from './ai.js';
import pricing from './pricing.js';
import availabilityRules from './availability_rules.js';
import contact from './contact.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', auth);
router.use('/accommodations', accommodations);
router.use('/bookings', bookings);
router.use('/content', content);
router.use('/dashboard', dashboard);
// Public catalog endpoints for customer frontend
router.use('/catalog', catalog);
// Mail endpoints (public)
router.use('/mail', mail);
router.use('/contact', contact);
router.use('/uploads', uploads);
// AI helper endpoints
router.use('/ai', ai);
// Admin pricing and availability management
router.use('/pricing', pricing);
router.use('/availability-rules', availabilityRules);

export default router;

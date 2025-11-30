import { airtableWebhookHandler } from '../controllers/webhooks.controller.js';
import { Router } from 'express';
const router = Router();

// POST /api/webhooks/airtable
router.post('/airtable', airtableWebhookHandler);

export default router;

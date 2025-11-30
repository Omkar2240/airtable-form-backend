import { getBases, getTables, getFields, login, callback } from '../controllers/airtable.controller.js';
import { Router } from 'express';

const router = Router();

// GET /auth/airtable/login
router.get('/login', login);

// GET /auth/airtable/callback
router.get('/callback', callback);

// GET /auth/airtable/bases
router.get('/bases', getBases);

// GET /auth/airtable/bases/:baseId/tables
router.get('/bases/:baseId/tables', getTables);

// GET /auth/airtable/bases/:baseId/tables/:tableId/fields
router.get('/bases/:baseId/tables/:tableId/fields', getFields);

export default router;

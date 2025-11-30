import { createForm, getForm, submitForm, listResponses } from '../controllers/forms.controller.js';
import { Router } from 'express';

const router = Router();

// POST /api/forms
router.post('/', createForm);

// GET /api/forms/:formId
router.get('/:formId', getForm);

// POST /api/forms/:formId/submit
router.post('/:formId/submit', submitForm);

// GET /api/forms/:formId/responses
router.get('/:formId/responses', listResponses);

export default router;

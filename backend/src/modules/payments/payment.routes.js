const { Router } = require('express');
const controller = require('./payment.controller');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { createBody, idParam, listQuery } = require('./payment.validation');

const router = Router();

router.get('/', requireAuth, validateQuery(listQuery), controller.list);
router.get('/:id', requireAuth, validateParams(idParam), controller.getById);
router.post('/', requireAuth, requireRole('admin', 'staff'), validateBody(createBody), controller.create);

module.exports = router;

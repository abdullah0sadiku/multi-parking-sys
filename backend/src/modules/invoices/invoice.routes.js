const { Router } = require('express');
const controller = require('./invoice.controller');
const { validateQuery, validateParams } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { idParam, listQuery } = require('./invoice.validation');

const router = Router();

router.get('/',                requireAuth, validateQuery(listQuery),  controller.list);
router.get('/:id',             requireAuth, validateParams(idParam),   controller.getById);
router.get('/:id/download',    requireAuth, validateParams(idParam),   controller.download);

module.exports = router;

const { Router } = require('express');
const controller = require('./session.controller');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { startBody, idParam, listQuery, payBody } = require('./session.validation');

const router = Router();

router.get('/', requireAuth, validateQuery(listQuery), controller.list);
router.get('/:id', requireAuth, validateParams(idParam), controller.getById);
router.post('/', requireAuth, requireRole('admin', 'staff'), validateBody(startBody), controller.start);
router.patch('/:id/end', requireAuth, requireRole('admin', 'staff'), validateParams(idParam), controller.end);
router.post('/:id/pay', requireAuth, requireRole('admin', 'staff'), validateParams(idParam), validateBody(payBody), controller.pay);

module.exports = router;

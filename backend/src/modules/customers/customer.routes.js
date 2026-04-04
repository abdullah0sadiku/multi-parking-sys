const { Router } = require('express');
const controller = require('./customer.controller');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { createBody, updateBody, idParam, listQuery } = require('./customer.validation');

const router = Router();

router.get('/', requireAuth, validateQuery(listQuery), controller.list);
router.get('/:id', requireAuth, validateParams(idParam), controller.getById);
router.post('/', requireAuth, requireRole('admin', 'staff'), validateBody(createBody), controller.create);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), validateParams(idParam), validateBody(updateBody), controller.update);
router.delete('/:id', requireAuth, requireRole('admin'), validateParams(idParam), controller.remove);

module.exports = router;

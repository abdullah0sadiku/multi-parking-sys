const { Router } = require('express');
const authController = require('./auth.controller');
const { validateBody } = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { loginBody, registerBody, bootstrapBody } = require('./auth.validation');

const router = Router();

router.post('/bootstrap', validateBody(bootstrapBody), authController.bootstrap);
router.post('/login', validateBody(loginBody), authController.login);
router.post('/register', requireAuth, requireRole('admin'), validateBody(registerBody), authController.register);
router.get('/me', requireAuth, authController.me);

module.exports = router;

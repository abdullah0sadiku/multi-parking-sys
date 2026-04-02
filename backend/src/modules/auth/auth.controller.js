const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const result = await authService.register(email, password, role);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
}

async function bootstrap(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.bootstrapAdmin(email, password);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

module.exports = { login, register, me, bootstrap };

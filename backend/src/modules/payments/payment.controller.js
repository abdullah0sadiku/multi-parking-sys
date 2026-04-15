const service = require('./payment.service');

async function list(req, res, next) {
  try {
    const result = await service.list(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const row = await service.getById(Number(req.params.id));
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const row = await service.create(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create };

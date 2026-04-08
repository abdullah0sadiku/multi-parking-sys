const service = require('./session.service');

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

async function start(req, res, next) {
  try {
    const row = await service.start(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function end(req, res, next) {
  try {
    const row = await service.end(Number(req.params.id));
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function pay(req, res, next) {
  try {
    const result = await service.pay(Number(req.params.id), req.body.method);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, start, end, pay };

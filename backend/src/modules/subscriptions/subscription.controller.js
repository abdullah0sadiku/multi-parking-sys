const service = require('./subscription.service');

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

async function update(req, res, next) {
  try {
    const row = await service.update(Number(req.params.id), req.body);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

async function generateInvoice(req, res, next) {
  try {
    const row = await service.generateInvoice(Number(req.params.id));
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create, update, remove, generateInvoice };

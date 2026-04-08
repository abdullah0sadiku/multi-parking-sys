const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./vehicle.repository');
const customerRepo = require('../customers/customer.repository');

async function create(body) {
  const c = await customerRepo.findById(body.customer_id);
  if (!c) throw new AppError('Customer not found', 404, 'NOT_FOUND');
  return repo.insert(body);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
  return row;
}

async function update(id, body) {
  await getById(id);
  if (body.customer_id) {
    const c = await customerRepo.findById(body.customer_id);
    if (!c) throw new AppError('Customer not found', 404, 'NOT_FOUND');
  }
  return repo.update(id, body);
}

async function remove(id) {
  await getById(id);
  await repo.remove(id);
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.list({
    offset,
    limit,
    customer_id: query.customer_id ? Number(query.customer_id) : undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

module.exports = { create, getById, update, remove, list };

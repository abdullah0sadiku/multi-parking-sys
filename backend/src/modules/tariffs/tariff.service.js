const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./tariff.repository');

async function create(body) {
  return repo.insert(body);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Tariff not found', 404, 'NOT_FOUND');
  return row;
}

async function update(id, body) {
  await getById(id);
  return repo.update(id, body);
}

async function remove(id) {
  await getById(id);
  await repo.remove(id);
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  let is_active;
  if (query.is_active === 'true') is_active = true;
  else if (query.is_active === 'false') is_active = false;
  const { rows, total } = await repo.list({
    offset,
    limit,
    is_active,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

module.exports = { create, getById, update, remove, list };

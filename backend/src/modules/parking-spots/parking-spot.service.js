const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./parking-spot.repository');
const levelRepo = require('../parking-levels/parking-level.repository');

async function create(body) {
  const level = await levelRepo.findById(body.level_id);
  if (!level) throw new AppError('Parking level not found', 404, 'NOT_FOUND');
  return repo.insert(body);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Parking spot not found', 404, 'NOT_FOUND');
  return row;
}

async function update(id, body) {
  await getById(id);
  if (body.level_id) {
    const l = await levelRepo.findById(body.level_id);
    if (!l) throw new AppError('Parking level not found', 404, 'NOT_FOUND');
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
    level_id: query.level_id ? Number(query.level_id) : undefined,
    status: query.status || undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

module.exports = { create, getById, update, remove, list };

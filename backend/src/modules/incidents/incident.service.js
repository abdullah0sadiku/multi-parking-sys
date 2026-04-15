const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./incident.repository');
const vehicleRepo = require('../vehicles/vehicle.repository');

async function create(body) {
  const v = await vehicleRepo.findById(body.vehicle_id);
  if (!v) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
  return repo.insert(body);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Incident not found', 404, 'NOT_FOUND');
  return row;
}

async function update(id, body) {
  await getById(id);
  if (body.vehicle_id) {
    const v = await vehicleRepo.findById(body.vehicle_id);
    if (!v) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
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
    vehicle_id: query.vehicle_id ? Number(query.vehicle_id) : undefined,
    status: query.status || undefined,
    severity: query.severity || undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

module.exports = { create, getById, update, remove, list };

const { query } = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const repo = require('./parking-level.repository');

async function create(body) {
  const level = await repo.insert(body);
  if (body.capacity > 0) {
    await _generateSpots(level.id, level.prefix, body.capacity);
  }
  return repo.findById(level.id);
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) throw new AppError('Parking level not found', 404, 'NOT_FOUND');
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

async function list(query_) {
  const { page, limit, offset } = parsePagination(query_);
  const { rows, total } = await repo.list({
    offset,
    limit,
    search: query_.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

/**
 * Generate spots for a level using its prefix and capacity.
 * Existing spot_codes are skipped (INSERT IGNORE via unique constraint).
 * Returns count of newly inserted spots.
 */
async function generateSpots(levelId) {
  const level = await getById(levelId);
  if (!level.prefix || !level.capacity) {
    throw new AppError('Level must have prefix and capacity set before generating spots', 400, 'INVALID_LEVEL');
  }
  return _generateSpots(levelId, level.prefix, level.capacity);
}

async function _generateSpots(levelId, prefix, capacity) {
  const values = [];
  for (let i = 1; i <= capacity; i++) {
    const code = `${prefix}${String(i).padStart(3, '0')}`;
    values.push([levelId, code, 'available']);
  }
  if (!values.length) return 0;
  const placeholders = values.map(() => '(?, ?, ?)').join(', ');
  const flat = values.flat();
  const res = await query(
    `INSERT IGNORE INTO parking_spots (level_id, spot_code, status) VALUES ${placeholders}`,
    flat
  );
  return res.affectedRows ?? 0;
}

module.exports = { create, getById, update, remove, list, generateSpots };

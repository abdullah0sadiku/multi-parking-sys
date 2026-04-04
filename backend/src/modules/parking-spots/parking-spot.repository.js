const { query, queryOne, run, runOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO parking_spots (level_id, spot_code, status) VALUES (?, ?, ?)',
    [data.level_id, data.spot_code, data.status || 'available']
  );
  return findById(res.insertId);
}

async function findById(id, conn) {
  return conn
    ? runOne(conn, 'SELECT * FROM parking_spots WHERE id = ?', [id])
    : queryOne('SELECT * FROM parking_spots WHERE id = ?', [id]);
}

async function findByIdForUpdate(conn, id) {
  const rows = await run(conn, 'SELECT * FROM parking_spots WHERE id = ? FOR UPDATE', [id]);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function update(id, data, conn) {
  const fields = [];
  const values = [];
  if (data.level_id !== undefined) {
    fields.push('level_id = ?');
    values.push(data.level_id);
  }
  if (data.spot_code !== undefined) {
    fields.push('spot_code = ?');
    values.push(data.spot_code);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (!fields.length) return findById(id, conn);
  values.push(id);
  await run(conn, `UPDATE parking_spots SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id, conn);
}

async function remove(id) {
  await query('DELETE FROM parking_spots WHERE id = ?', [id]);
}

async function list({ offset, limit, level_id, status, search }) {
  let sql = 'SELECT SQL_CALC_FOUND_ROWS ps.*, pl.name AS level_name FROM parking_spots ps JOIN parking_levels pl ON pl.id = ps.level_id WHERE 1=1';
  const params = [];
  if (level_id) {
    sql += ' AND ps.level_id = ?';
    params.push(level_id);
  }
  if (status) {
    sql += ' AND ps.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND ps.spot_code LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY pl.floor_number ASC, ps.spot_code ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

async function findFirstAvailable({ level_id }, conn) {
  let sql = `SELECT * FROM parking_spots WHERE status = 'available'`;
  const params = [];
  if (level_id) {
    sql += ' AND level_id = ?';
    params.push(level_id);
  }
  sql += ' ORDER BY id ASC LIMIT 1 FOR UPDATE';
  const rows = await run(conn, sql, params);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

/**
 * Recommend the next available spot ordered by level floor_number ASC then spot_code ASC.
 * Implements the "fill from Level A → B → C" recommendation logic.
 */
async function findRecommendedAvailable(excludeSpotIds = []) {
  let sql = `
    SELECT ps.*, pl.name AS level_name, pl.floor_number
    FROM parking_spots ps
    JOIN parking_levels pl ON pl.id = ps.level_id
    WHERE ps.status = 'available'`;
  const params = [];
  if (excludeSpotIds.length) {
    sql += ` AND ps.id NOT IN (${excludeSpotIds.map(() => '?').join(',')})`;
    params.push(...excludeSpotIds);
  }
  sql += ' ORDER BY pl.floor_number ASC, ps.spot_code ASC LIMIT 5';
  return query(sql, params);
}

async function listByLevel(levelId) {
  return query(
    'SELECT * FROM parking_spots WHERE level_id = ? ORDER BY spot_code ASC',
    [levelId]
  );
}

module.exports = {
  insert,
  findById,
  findByIdForUpdate,
  update,
  remove,
  list,
  findFirstAvailable,
  findRecommendedAvailable,
  listByLevel,
};

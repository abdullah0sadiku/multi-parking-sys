const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO parking_levels (name, prefix, floor_number, capacity, description) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.prefix, data.floor_number, data.capacity ?? 0, data.description ?? null]
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne('SELECT * FROM parking_levels WHERE id = ?', [id]);
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined)         { fields.push('name = ?');         values.push(data.name); }
  if (data.prefix !== undefined)       { fields.push('prefix = ?');       values.push(data.prefix); }
  if (data.floor_number !== undefined) { fields.push('floor_number = ?'); values.push(data.floor_number); }
  if (data.capacity !== undefined)     { fields.push('capacity = ?');     values.push(data.capacity); }
  if (data.description !== undefined)  { fields.push('description = ?');  values.push(data.description); }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE parking_levels SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM parking_levels WHERE id = ?', [id]);
}

async function list({ offset, limit, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS pl.*,
    COUNT(ps.id)                                              AS total_spots,
    SUM(ps.status = 'available')                              AS available_spots,
    SUM(ps.status = 'occupied')                               AS occupied_spots,
    SUM(ps.status = 'reserved')                               AS reserved_spots,
    SUM(ps.status = 'maintenance')                            AS maintenance_spots
  FROM parking_levels pl
  LEFT JOIN parking_spots ps ON ps.level_id = pl.id
  WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ' AND (pl.name LIKE ? OR pl.description LIKE ? OR pl.prefix LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  sql += ' GROUP BY pl.id ORDER BY pl.floor_number ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, update, remove, list };

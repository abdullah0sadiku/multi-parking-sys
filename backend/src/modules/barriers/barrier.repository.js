const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO barriers (level_id, name, location_note, status) VALUES (?, ?, ?, ?)',
    [data.level_id, data.name, data.location_note ?? null, data.status || 'operational']
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne(
    `SELECT b.*, pl.name AS level_name FROM barriers b
     JOIN parking_levels pl ON pl.id = b.level_id WHERE b.id = ?`,
    [id]
  );
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.level_id !== undefined) {
    fields.push('level_id = ?');
    values.push(data.level_id);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.location_note !== undefined) {
    fields.push('location_note = ?');
    values.push(data.location_note);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE barriers SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM barriers WHERE id = ?', [id]);
}

async function list({ offset, limit, level_id, status, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS b.*, pl.name AS level_name FROM barriers b
    JOIN parking_levels pl ON pl.id = b.level_id WHERE 1=1`;
  const params = [];
  if (level_id) {
    sql += ' AND b.level_id = ?';
    params.push(level_id);
  }
  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND b.name LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY b.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, update, remove, list };

const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO tariffs (name, rate_per_hour, vat_percent, currency, is_active) VALUES (?, ?, ?, ?, ?)',
    [
      data.name,
      data.rate_per_hour,
      data.vat_percent ?? 0,
      data.currency || 'USD',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    ]
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne('SELECT * FROM tariffs WHERE id = ?', [id]);
}

async function findDefaultActive() {
  return queryOne(`SELECT * FROM tariffs WHERE is_active = 1 ORDER BY id ASC LIMIT 1`);
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.rate_per_hour !== undefined) {
    fields.push('rate_per_hour = ?');
    values.push(data.rate_per_hour);
  }
  if (data.vat_percent !== undefined) {
    fields.push('vat_percent = ?');
    values.push(data.vat_percent);
  }
  if (data.currency !== undefined) {
    fields.push('currency = ?');
    values.push(data.currency);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE tariffs SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM tariffs WHERE id = ?', [id]);
}

async function list({ offset, limit, is_active, search }) {
  let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM tariffs WHERE 1=1';
  const params = [];
  if (is_active === true || is_active === false) {
    sql += ' AND is_active = ?';
    params.push(is_active ? 1 : 0);
  }
  if (search) {
    sql += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, findDefaultActive, update, remove, list };

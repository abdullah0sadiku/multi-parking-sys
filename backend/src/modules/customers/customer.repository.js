const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO customers (full_name, email, phone) VALUES (?, ?, ?)',
    [data.full_name, data.email ?? null, data.phone ?? null]
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne('SELECT * FROM customers WHERE id = ?', [id]);
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.full_name !== undefined) {
    fields.push('full_name = ?');
    values.push(data.full_name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM customers WHERE id = ?', [id]);
}

async function list({ offset, limit, search }) {
  let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM customers WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, update, remove, list };

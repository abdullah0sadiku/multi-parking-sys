const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    'INSERT INTO vehicles (customer_id, license_plate, vehicle_type) VALUES (?, ?, ?)',
    [data.customer_id, data.license_plate, data.vehicle_type ?? null]
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne(
    `SELECT v.*, c.full_name AS customer_name FROM vehicles v
     JOIN customers c ON c.id = v.customer_id WHERE v.id = ?`,
    [id]
  );
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.customer_id !== undefined) {
    fields.push('customer_id = ?');
    values.push(data.customer_id);
  }
  if (data.license_plate !== undefined) {
    fields.push('license_plate = ?');
    values.push(data.license_plate);
  }
  if (data.vehicle_type !== undefined) {
    fields.push('vehicle_type = ?');
    values.push(data.vehicle_type);
  }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM vehicles WHERE id = ?', [id]);
}

async function list({ offset, limit, customer_id, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS v.*, c.full_name AS customer_name FROM vehicles v
    JOIN customers c ON c.id = v.customer_id WHERE 1=1`;
  const params = [];
  if (customer_id) {
    sql += ' AND v.customer_id = ?';
    params.push(customer_id);
  }
  if (search) {
    sql += ' AND (v.license_plate LIKE ? OR c.full_name LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q);
  }
  sql += ' ORDER BY v.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, update, remove, list };

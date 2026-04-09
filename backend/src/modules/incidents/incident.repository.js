const { query, queryOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    `INSERT INTO incidents (vehicle_id, title, description, severity, status, reported_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.vehicle_id,
      data.title,
      data.description ?? null,
      data.severity || 'medium',
      data.status || 'open',
      data.reported_at || new Date(),
    ]
  );
  return findById(res.insertId);
}

async function findById(id) {
  return queryOne(
    `SELECT i.*, v.license_plate FROM incidents i
     JOIN vehicles v ON v.id = i.vehicle_id WHERE i.id = ?`,
    [id]
  );
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.vehicle_id !== undefined) {
    fields.push('vehicle_id = ?');
    values.push(data.vehicle_id);
  }
  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.severity !== undefined) {
    fields.push('severity = ?');
    values.push(data.severity);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.reported_at !== undefined) {
    fields.push('reported_at = ?');
    values.push(data.reported_at);
  }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM incidents WHERE id = ?', [id]);
}

async function list({ offset, limit, vehicle_id, status, severity, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS i.*, v.license_plate FROM incidents i
    JOIN vehicles v ON v.id = i.vehicle_id WHERE 1=1`;
  const params = [];
  if (vehicle_id) {
    sql += ' AND i.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (severity) {
    sql += ' AND i.severity = ?';
    params.push(severity);
  }
  if (search) {
    sql += ' AND (i.title LIKE ? OR i.description LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q);
  }
  sql += ' ORDER BY i.reported_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, update, remove, list };

const { query, queryOne, run, runOne } = require('../../config/database');

async function insert(data) {
  const res = await query(
    `INSERT INTO subscriptions (customer_id, vehicle_id, spot_id, tariff_id, valid_from, valid_to, status, monthly_fee, auto_invoice)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.customer_id,
      data.vehicle_id,
      data.spot_id ?? null,
      data.tariff_id ?? null,
      data.valid_from,
      data.valid_to,
      data.status || 'active',
      data.monthly_fee ?? null,
      data.auto_invoice ? 1 : 0,
    ]
  );
  return findById(res.insertId);
}

async function findById(id, conn) {
  const sql = `SELECT s.*, c.full_name AS customer_name, v.license_plate,
    sp.spot_code, t.name AS tariff_name
    FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    JOIN vehicles v ON v.id = s.vehicle_id
    LEFT JOIN parking_spots sp ON sp.id = s.spot_id
    LEFT JOIN tariffs t ON t.id = s.tariff_id
    WHERE s.id = ?`;
  return conn ? runOne(conn, sql, [id]) : queryOne(sql, [id]);
}

async function findActiveForVehicle(conn, vehicleId) {
  const sql = `SELECT * FROM subscriptions WHERE vehicle_id = ? AND status = 'active'
    AND CURDATE() BETWEEN valid_from AND valid_to ORDER BY id DESC LIMIT 1`;
  return conn ? runOne(conn, sql, [vehicleId]) : queryOne(sql, [vehicleId]);
}

async function update(id, data, conn) {
  const fields = [];
  const values = [];
  if (data.customer_id !== undefined) {
    fields.push('customer_id = ?');
    values.push(data.customer_id);
  }
  if (data.vehicle_id !== undefined) {
    fields.push('vehicle_id = ?');
    values.push(data.vehicle_id);
  }
  if (data.spot_id !== undefined) {
    fields.push('spot_id = ?');
    values.push(data.spot_id);
  }
  if (data.tariff_id !== undefined) {
    fields.push('tariff_id = ?');
    values.push(data.tariff_id);
  }
  if (data.valid_from !== undefined) {
    fields.push('valid_from = ?');
    values.push(data.valid_from);
  }
  if (data.valid_to !== undefined) {
    fields.push('valid_to = ?');
    values.push(data.valid_to);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.monthly_fee !== undefined) {
    fields.push('monthly_fee = ?');
    values.push(data.monthly_fee);
  }
  if (data.auto_invoice !== undefined) {
    fields.push('auto_invoice = ?');
    values.push(data.auto_invoice ? 1 : 0);
  }
  if (!fields.length) return findById(id, conn);
  values.push(id);
  await run(conn, `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id, conn);
}

async function remove(id) {
  await query('DELETE FROM subscriptions WHERE id = ?', [id]);
}

async function list({ offset, limit, customer_id, vehicle_id, status, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS s.*, c.full_name AS customer_name, v.license_plate,
    sp.spot_code, t.name AS tariff_name
    FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    JOIN vehicles v ON v.id = s.vehicle_id
    LEFT JOIN parking_spots sp ON sp.id = s.spot_id
    LEFT JOIN tariffs t ON t.id = s.tariff_id
    WHERE 1=1`;
  const params = [];
  if (customer_id) {
    sql += ' AND s.customer_id = ?';
    params.push(customer_id);
  }
  if (vehicle_id) {
    sql += ' AND s.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (v.license_plate LIKE ? OR c.full_name LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q);
  }
  sql += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, findActiveForVehicle, update, remove, list };

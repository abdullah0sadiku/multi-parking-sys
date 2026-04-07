const { query, queryOne, run, runOne } = require('../../config/database');

async function findById(id, conn) {
  const sql = `
    SELECT ps.*,
      v.license_plate, v.customer_id,
      sp.spot_code, sp.level_id,
      pl.name AS level_name, pl.floor_number,
      t.name AS tariff_name, t.rate_per_hour, t.vat_percent AS tariff_vat_percent
    FROM parking_sessions ps
    JOIN vehicles v ON v.id = ps.vehicle_id
    JOIN parking_spots sp ON sp.id = ps.spot_id
    JOIN parking_levels pl ON pl.id = sp.level_id
    LEFT JOIN tariffs t ON t.id = ps.tariff_id
    WHERE ps.id = ?
  `;
  return conn ? runOne(conn, sql, [id]) : queryOne(sql, [id]);
}

async function findActiveByVehicle(conn, vehicleId) {
  const sql = `SELECT * FROM parking_sessions WHERE vehicle_id = ? AND status = 'active' LIMIT 1`;
  return conn ? runOne(conn, sql, [vehicleId]) : queryOne(sql, [vehicleId]);
}

async function list({ offset, limit, vehicle_id, spot_id, customer_id, status, search }) {
  let sql = `
    SELECT SQL_CALC_FOUND_ROWS ps.*, v.license_plate, v.customer_id,
      sp.spot_code, pl.name AS level_name,
      c.full_name AS customer_name,
      inv.id AS invoice_id, inv.status AS invoice_status, inv.total AS invoice_total
    FROM parking_sessions ps
    JOIN vehicles v ON v.id = ps.vehicle_id
    LEFT JOIN customers c ON c.id = v.customer_id
    JOIN parking_spots sp ON sp.id = ps.spot_id
    JOIN parking_levels pl ON pl.id = sp.level_id
    LEFT JOIN invoices inv ON inv.parking_session_id = ps.id
    WHERE 1=1`;
  const params = [];
  if (customer_id) {
    sql += ' AND v.customer_id = ?';
    params.push(customer_id);
  }
  if (vehicle_id) {
    sql += ' AND ps.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (spot_id) {
    sql += ' AND ps.spot_id = ?';
    params.push(spot_id);
  }
  if (status) {
    sql += ' AND ps.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (v.license_plate LIKE ? OR c.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY ps.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { findById, findActiveByVehicle, list };

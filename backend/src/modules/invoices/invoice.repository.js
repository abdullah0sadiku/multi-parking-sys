const { query, queryOne, run, runOne } = require('../../config/database');

async function insert(data, conn) {
  const sql = `INSERT INTO invoices (parking_session_id, subscription_id, subtotal, vat_rate, vat_amount, total, status, due_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.parking_session_id ?? null,
    data.subscription_id ?? null,
    data.subtotal,
    data.vat_rate,
    data.vat_amount,
    data.total,
    data.status || 'pending',
    data.due_at ?? null,
  ];
  const res = conn ? await run(conn, sql, params) : await query(sql, params);
  const insertId = res.insertId;
  return findById(insertId, conn);
}

async function findById(id, conn) {
  const sql = `
    SELECT
      i.*,
      /* Session fields */
      ps.started_at        AS sess_started_at,
      ps.ended_at          AS sess_ended_at,
      ps.duration_minutes  AS sess_duration_minutes,
      ps.status            AS sess_status,
      /* Vehicle / customer via session */
      v_sess.license_plate AS sess_license_plate,
      v_sess.vehicle_type  AS sess_vehicle_type,
      c_sess.full_name     AS sess_customer_name,
      c_sess.email         AS sess_customer_email,
      c_sess.phone         AS sess_customer_phone,
      /* Spot / level via session */
      sp_sess.spot_code    AS sess_spot_code,
      pl_sess.name         AS sess_level_name,
      /* Tariff via session */
      t_sess.name          AS sess_tariff_name,
      t_sess.rate_per_hour AS sess_rate_per_hour,
      t_sess.currency      AS sess_currency,
      /* Subscription fields */
      sub.valid_from       AS sub_valid_from,
      sub.valid_to         AS sub_valid_to,
      /* Vehicle / customer via subscription */
      v_sub.license_plate  AS sub_license_plate,
      c_sub.full_name      AS sub_customer_name,
      c_sub.email          AS sub_customer_email,
      c_sub.phone          AS sub_customer_phone,
      sp_sub.spot_code     AS sub_spot_code,
      pl_sub.name          AS sub_level_name,
      t_sub.name           AS sub_tariff_name,
      t_sub.currency       AS sub_currency
    FROM invoices i
    /* Session path */
    LEFT JOIN parking_sessions ps   ON ps.id   = i.parking_session_id
    LEFT JOIN vehicles  v_sess      ON v_sess.id  = ps.vehicle_id
    LEFT JOIN customers c_sess      ON c_sess.id  = v_sess.customer_id
    LEFT JOIN parking_spots  sp_sess ON sp_sess.id = ps.spot_id
    LEFT JOIN parking_levels pl_sess ON pl_sess.id = sp_sess.level_id
    LEFT JOIN tariffs   t_sess      ON t_sess.id  = ps.tariff_id
    /* Subscription path */
    LEFT JOIN subscriptions sub     ON sub.id  = i.subscription_id
    LEFT JOIN vehicles  v_sub       ON v_sub.id   = sub.vehicle_id
    LEFT JOIN customers c_sub       ON c_sub.id   = sub.customer_id
    LEFT JOIN parking_spots  sp_sub ON sp_sub.id  = sub.spot_id
    LEFT JOIN parking_levels pl_sub ON pl_sub.id  = sp_sub.level_id
    LEFT JOIN tariffs   t_sub       ON t_sub.id   = sub.tariff_id
    WHERE i.id = ?`;
  return conn ? runOne(conn, sql, [id]) : queryOne(sql, [id]);
}

async function updateStatus(id, status, conn) {
  await run(conn, `UPDATE invoices SET status = ? WHERE id = ?`, [status, id]);
  return findById(id, conn);
}

async function sumPaidForInvoice(conn, invoiceId) {
  const row = await runOne(
    conn,
    `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = ? AND status = 'completed'`,
    [invoiceId]
  );
  return Number(row?.paid || 0);
}

async function list({ offset, limit, customer_id, status, search }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS i.*,
    COALESCE(c_sess.full_name, c_sub.full_name) AS customer_name
    FROM invoices i
    LEFT JOIN parking_sessions ps ON ps.id = i.parking_session_id
    LEFT JOIN vehicles v_sess ON v_sess.id = ps.vehicle_id
    LEFT JOIN customers c_sess ON c_sess.id = v_sess.customer_id
    LEFT JOIN subscriptions sub ON sub.id = i.subscription_id
    LEFT JOIN customers c_sub ON c_sub.id = sub.customer_id
    WHERE 1=1`;
  const params = [];
  if (customer_id) {
    sql += ' AND (v_sess.customer_id = ? OR sub.customer_id = ?)';
    params.push(customer_id, customer_id);
  }
  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (CAST(i.id AS CHAR) LIKE ? OR c_sess.full_name LIKE ? OR c_sub.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY i.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, updateStatus, sumPaidForInvoice, list };

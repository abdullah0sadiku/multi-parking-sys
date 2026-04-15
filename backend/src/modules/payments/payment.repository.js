const { query, queryOne, run, runOne } = require('../../config/database');

async function insert(data, conn) {
  const sql = `INSERT INTO payments (invoice_id, amount, method, transaction_ref, paid_at, status)
    VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    data.invoice_id,
    data.amount,
    data.method,
    data.transaction_ref ?? null,
    data.paid_at || new Date(),
    data.status || 'completed',
  ];
  const res = conn ? await run(conn, sql, params) : await query(sql, params);
  const insertId = res.insertId;
  return findById(insertId, conn);
}

async function findById(id, conn) {
  const sql = `SELECT p.*, i.total AS invoice_total, i.status AS invoice_status
    FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE p.id = ?`;
  return conn ? runOne(conn, sql, [id]) : queryOne(sql, [id]);
}

async function listByInvoice(invoiceId) {
  return query(
    'SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC',
    [invoiceId]
  );
}

async function list({ offset, limit, invoice_id, status }) {
  let sql = `SELECT SQL_CALC_FOUND_ROWS p.*, i.total AS invoice_total,
    COALESCE(c_sess.full_name, c_sub.full_name) AS customer_name
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    LEFT JOIN parking_sessions ps ON ps.id = i.parking_session_id
    LEFT JOIN vehicles v_sess ON v_sess.id = ps.vehicle_id
    LEFT JOIN customers c_sess ON c_sess.id = v_sess.customer_id
    LEFT JOIN subscriptions sub ON sub.id = i.subscription_id
    LEFT JOIN customers c_sub ON c_sub.id = sub.customer_id
    WHERE 1=1`;
  const params = [];
  if (invoice_id) {
    sql += ' AND p.invoice_id = ?';
    params.push(invoice_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await query(sql, params);
  const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
  return { rows, total: Number(totalRow.total) };
}

module.exports = { insert, findById, listByInvoice, list };

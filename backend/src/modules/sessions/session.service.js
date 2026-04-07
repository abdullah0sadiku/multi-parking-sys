const { withTransaction, run, runOne } = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const spotRepo = require('../parking-spots/parking-spot.repository');
const sessionRepo = require('./session.repository');
const subscriptionRepo = require('../subscriptions/subscription.repository');
const invoiceRepo = require('../invoices/invoice.repository');
const paymentRepo = require('../payments/payment.repository');

function toMysqlDatetime(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function getById(id) {
  const row = await sessionRepo.findById(id);
  if (!row) throw new AppError('Parking session not found', 404, 'NOT_FOUND');
  return row;
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await sessionRepo.list({
    offset,
    limit,
    customer_id: query.customer_id ? Number(query.customer_id) : undefined,
    vehicle_id: query.vehicle_id ? Number(query.vehicle_id) : undefined,
    spot_id: query.spot_id ? Number(query.spot_id) : undefined,
    status: query.status || undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

/**
 * Start a walk-in parking session.
 *
 * Sessions are ONLY for walk-in (non-subscribed) vehicles.
 * Subscribed customers have reserved spots and pay monthly — they do not
 * generate sessions. If the plate belongs to a vehicle with an active
 * subscription, this call is rejected.
 *
 * If the license plate is unknown it is registered automatically as a
 * walk-in vehicle (customer_id = NULL).
 */
async function start(body) {
  const { license_plate, spot_id, tariff_id, notes } = body;
  const plate = license_plate.trim().toUpperCase();

  return withTransaction(async (conn) => {
    // ── 1. Resolve / auto-create vehicle ───────────────────────────────────
    let vehicle = await runOne(conn, 'SELECT * FROM vehicles WHERE license_plate = ? FOR UPDATE', [plate]);

    if (!vehicle) {
      // Walk-in: plate not in system yet — register it without a customer account
      const ins = await run(
        conn,
        'INSERT INTO vehicles (customer_id, license_plate, vehicle_type) VALUES (NULL, ?, ?)',
        [plate, 'Unknown']
      );
      vehicle = await runOne(conn, 'SELECT * FROM vehicles WHERE id = ?', [ins.insertId]);
    }

    // ── 2. Block subscribed vehicles ────────────────────────────────────────
    const sub = await subscriptionRepo.findActiveForVehicle(conn, vehicle.id);
    if (sub) {
      throw new AppError(
        `Vehicle ${plate} has an active subscription (spot ${sub.spot_code ?? sub.spot_id ?? '?'}). ` +
        'Subscribed customers use their reserved spot and are billed monthly — no session needed.',
        409,
        'VEHICLE_HAS_SUBSCRIPTION'
      );
    }

    // ── 3. Block if already in an active session ────────────────────────────
    const existing = await sessionRepo.findActiveByVehicle(conn, vehicle.id);
    if (existing) {
      throw new AppError('Vehicle already has an active parking session', 409, 'ACTIVE_SESSION_EXISTS');
    }

    // ── 4. Assign spot — only AVAILABLE spots (never reserved) ─────────────
    let spot;
    if (spot_id) {
      spot = await spotRepo.findByIdForUpdate(conn, spot_id);
      if (!spot) throw new AppError('Parking spot not found', 404, 'NOT_FOUND');
      if (spot.status !== 'available') {
        throw new AppError(
          `Spot ${spot.spot_code} is ${spot.status} and cannot be used for a walk-in session`,
          409,
          'SPOT_NOT_AVAILABLE'
        );
      }
    } else {
      spot = await spotRepo.findFirstAvailable({}, conn);
      if (!spot) throw new AppError('No available parking spot', 409, 'NO_SPOT_AVAILABLE');
    }

    // ── 5. Resolve tariff ───────────────────────────────────────────────────
    let tariff = null;
    if (tariff_id) {
      tariff = await runOne(conn, 'SELECT * FROM tariffs WHERE id = ? AND is_active = 1', [tariff_id]);
      if (!tariff) throw new AppError('Tariff not found or inactive', 404, 'NOT_FOUND');
    }
    if (!tariff) {
      tariff = await runOne(conn, 'SELECT * FROM tariffs WHERE is_active = 1 ORDER BY id ASC LIMIT 1');
    }
    if (!tariff) throw new AppError('No active tariff configured — please create one first', 500, 'NO_TARIFF');

    // ── 6. Create session & occupy spot ────────────────────────────────────
    const startedAt = new Date();
    const res = await run(
      conn,
      `INSERT INTO parking_sessions (vehicle_id, spot_id, tariff_id, subscription_id, started_at, status, notes)
       VALUES (?, ?, ?, NULL, ?, 'active', ?)`,
      [vehicle.id, spot.id, tariff.id, toMysqlDatetime(startedAt), notes ?? null]
    );

    await run(conn, `UPDATE parking_spots SET status = 'occupied' WHERE id = ?`, [spot.id]);

    return sessionRepo.findById(res.insertId);
  });
}

/**
 * End session: duration, tariff, invoice, free spot (or reserved if subscription).
 */
async function end(sessionId) {
  return withTransaction(async (conn) => {
    const session = await runOne(conn, 'SELECT * FROM parking_sessions WHERE id = ? FOR UPDATE', [sessionId]);
    if (!session) throw new AppError('Parking session not found', 404, 'NOT_FOUND');
    if (session.status !== 'active') {
      throw new AppError('Session is not active', 409, 'SESSION_NOT_ACTIVE');
    }

    const tariff = await runOne(conn, 'SELECT * FROM tariffs WHERE id = ?', [session.tariff_id]);
    if (!tariff) throw new AppError('Tariff missing for session', 500, 'NO_TARIFF');

    const endedAt = new Date();
    const start = new Date(session.started_at);
    const durationMinutes = Math.max(1, Math.ceil((endedAt - start) / 60000));

    const hours = Math.max(1, Math.ceil(durationMinutes / 60));
    const subtotal = Number((hours * Number(tariff.rate_per_hour)).toFixed(2));
    const vatRate = Number(tariff.vat_percent);
    const vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
    const total = Number((subtotal + vatAmount).toFixed(2));

    await invoiceRepo.insert(
      {
        parking_session_id: sessionId,
        subscription_id: null,
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        status: 'pending',
        due_at: null,
      },
      conn
    );

    await run(conn, `UPDATE parking_sessions SET ended_at = ?, duration_minutes = ?, status = 'completed' WHERE id = ?`, [
      toMysqlDatetime(endedAt),
      durationMinutes,
      sessionId,
    ]);

    const sub =
      session.subscription_id != null
        ? await subscriptionRepo.findById(session.subscription_id, conn)
        : await subscriptionRepo.findActiveForVehicle(conn, session.vehicle_id);

    let newSpotStatus = 'available';
    if (sub && sub.spot_id === session.spot_id && sub.status === 'active') {
      newSpotStatus = 'reserved';
    }
    await run(conn, `UPDATE parking_spots SET status = ? WHERE id = ?`, [newSpotStatus, session.spot_id]);

    return sessionRepo.findById(sessionId, conn);
  });
}

/**
 * Mark a completed session as paid.
 * Finds the pending invoice for the session, records a payment, marks invoice paid.
 */
async function pay(sessionId, method) {
  return withTransaction(async (conn) => {
    const session = await runOne(conn, 'SELECT * FROM parking_sessions WHERE id = ? FOR UPDATE', [sessionId]);
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.status !== 'completed') {
      throw new AppError('Only completed sessions can be marked as paid', 409, 'SESSION_NOT_COMPLETED');
    }

    // Find existing invoice for this session
    let invoice = await runOne(conn, 'SELECT * FROM invoices WHERE parking_session_id = ? LIMIT 1', [sessionId]);

    if (!invoice) {
      // Edge case: session was completed without an invoice (data issue) — create one now
      const tariff = await runOne(conn, 'SELECT * FROM tariffs WHERE id = ?', [session.tariff_id]);
      const durationMinutes = session.duration_minutes ?? 1;
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      const ratePerHour = tariff ? Number(tariff.rate_per_hour) : 0;
      const subtotal = Number((hours * ratePerHour).toFixed(2));
      const vatRate = tariff ? Number(tariff.vat_percent) : 0;
      const vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
      const total = Number((subtotal + vatAmount).toFixed(2));
      invoice = await invoiceRepo.insert({ parking_session_id: sessionId, subtotal, vat_rate: vatRate, vat_amount: vatAmount, total, status: 'pending', due_at: null }, conn);
    }

    if (invoice.status === 'paid') {
      throw new AppError('Invoice for this session is already paid', 409, 'ALREADY_PAID');
    }

    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const payment = await paymentRepo.insert({
      invoice_id:      invoice.id,
      amount:          invoice.total,
      method:          method,
      transaction_ref: transactionRef,
      status:          'completed',
    }, conn);

    await invoiceRepo.updateStatus(invoice.id, 'paid', conn);

    return { session: await sessionRepo.findById(sessionId, conn), payment, transaction_ref: transactionRef };
  });
}

module.exports = { getById, list, start, end, pay };

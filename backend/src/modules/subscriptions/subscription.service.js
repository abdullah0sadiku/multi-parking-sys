const { withTransaction, run, runOne } = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const { env } = require('../../config/env');
const spotRepo = require('../parking-spots/parking-spot.repository');
const subscriptionRepo = require('./subscription.repository');
const invoiceRepo = require('../invoices/invoice.repository');

async function getById(id) {
  const row = await subscriptionRepo.findById(id);
  if (!row) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
  return row;
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await subscriptionRepo.list({
    offset,
    limit,
    customer_id: query.customer_id ? Number(query.customer_id) : undefined,
    vehicle_id: query.vehicle_id ? Number(query.vehicle_id) : undefined,
    status: query.status || undefined,
    search: query.search || undefined,
  });
  return {
    items: rows,
    meta: paginationMeta({ page, limit, total }),
  };
}

async function create(body) {
  return withTransaction(async (conn) => {
    const customer = await runOne(conn, 'SELECT id FROM customers WHERE id = ?', [body.customer_id]);
    if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

    const vehicle = await runOne(conn, 'SELECT * FROM vehicles WHERE id = ? AND customer_id = ? FOR UPDATE', [
      body.vehicle_id,
      body.customer_id,
    ]);
    if (!vehicle) throw new AppError('Vehicle not found for this customer', 404, 'NOT_FOUND');

    if (body.spot_id) {
      const spot = await spotRepo.findByIdForUpdate(conn, body.spot_id);
      if (!spot) throw new AppError('Parking spot not found', 404, 'NOT_FOUND');
      if (spot.status !== 'available') {
        throw new AppError('Spot must be available to assign to a subscription', 409, 'SPOT_NOT_AVAILABLE');
      }
    }

    const res = await run(
      conn,
      `INSERT INTO subscriptions (customer_id, vehicle_id, spot_id, tariff_id, valid_from, valid_to, status, monthly_fee, auto_invoice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.customer_id,
        body.vehicle_id,
        body.spot_id ?? null,
        body.tariff_id ?? null,
        body.valid_from,
        body.valid_to,
        body.status || 'active',
        body.monthly_fee ?? null,
        body.auto_invoice ? 1 : 0,
      ]
    );

    const subId = res.insertId;

    if (body.spot_id) {
      await run(conn, `UPDATE parking_spots SET status = 'reserved' WHERE id = ?`, [body.spot_id]);
    }

    if (body.auto_invoice && body.monthly_fee) {
      await generateInvoiceForSubscriptionId(conn, subId);
    }

    return subscriptionRepo.findById(subId, conn);
  });
}

async function update(id, body) {
  return withTransaction(async (conn) => {
    const prev = await subscriptionRepo.findById(id, conn);
    if (!prev) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    if (body.customer_id || body.vehicle_id) {
      const customerId = body.customer_id ?? prev.customer_id;
      const vehicleId = body.vehicle_id ?? prev.vehicle_id;
      const vehicle = await runOne(conn, 'SELECT * FROM vehicles WHERE id = ? AND customer_id = ?', [
        vehicleId,
        customerId,
      ]);
      if (!vehicle) throw new AppError('Vehicle not found for this customer', 404, 'NOT_FOUND');
    }

    if (body.spot_id !== undefined && body.spot_id !== prev.spot_id) {
      if (prev.spot_id) {
        await run(conn, `UPDATE parking_spots SET status = 'available' WHERE id = ?`, [prev.spot_id]);
      }
      if (body.spot_id) {
        const spot = await spotRepo.findByIdForUpdate(conn, body.spot_id);
        if (!spot) throw new AppError('Parking spot not found', 404, 'NOT_FOUND');
        if (spot.status !== 'available') {
          throw new AppError('New spot must be available', 409, 'SPOT_NOT_AVAILABLE');
        }
        await run(conn, `UPDATE parking_spots SET status = 'reserved' WHERE id = ?`, [body.spot_id]);
      }
    }

    const nextStatus = body.status ?? prev.status;
    if ((nextStatus === 'cancelled' || nextStatus === 'expired') && prev.spot_id) {
      await run(conn, `UPDATE parking_spots SET status = 'available' WHERE id = ?`, [prev.spot_id]);
    }

    await subscriptionRepo.update(id, body, conn);
    return subscriptionRepo.findById(id, conn);
  });
}

async function remove(id) {
  return withTransaction(async (conn) => {
    const prev = await subscriptionRepo.findById(id, conn);
    if (!prev) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    if (prev.spot_id) {
      await run(conn, `UPDATE parking_spots SET status = 'available' WHERE id = ?`, [prev.spot_id]);
    }
    await run(conn, 'DELETE FROM subscriptions WHERE id = ?', [id]);
  });
}

async function generateInvoiceForSubscriptionId(conn, subscriptionId) {
  const sub = await subscriptionRepo.findById(subscriptionId, conn);
  if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
  if (!sub.monthly_fee) {
    throw new AppError('Subscription has no monthly fee', 400, 'NO_FEE');
  }
  let vatRate = env.vatDefaultPercent;
  if (sub.tariff_id) {
    const t = await runOne(conn, 'SELECT vat_percent FROM tariffs WHERE id = ?', [sub.tariff_id]);
    if (t) vatRate = Number(t.vat_percent);
  }
  const subtotal = Number(sub.monthly_fee);
  const vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
  const total = Number((subtotal + vatAmount).toFixed(2));
  return invoiceRepo.insert(
    {
      parking_session_id: null,
      subscription_id: subscriptionId,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total,
      status: 'pending',
      due_at: null,
    },
    conn
  );
}

async function generateInvoice(subscriptionId) {
  return withTransaction(async (conn) => {
    return generateInvoiceForSubscriptionId(conn, subscriptionId);
  });
}

module.exports = { getById, list, create, update, remove, generateInvoice };

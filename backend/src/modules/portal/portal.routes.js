const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query, queryOne } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const { requireCustomer } = require('./portal.middleware');
const { validateBody, validateParams } = require('../../middleware/validate');
const { AppError } = require('../../utils/AppError');
const authService = require('../auth/auth.service');
const invoiceRepo = require('../invoices/invoice.repository');
const { generateInvoicePdf } = require('../invoices/invoice.pdf');
const paymentRepo = require('../payments/payment.repository');
const { withTransaction } = require('../../config/database');

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerBody = z.object({
  full_name: z.string().min(1).max(255),
  email:     z.string().email(),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  phone:     z.string().max(64).optional().nullable(),
});

const addVehicleBody = z.object({
  license_plate: z.string().min(1).max(32),
  vehicle_type:  z.string().max(64).optional().nullable(),
});

const updateVehicleBody = z.object({
  license_plate: z.string().min(1).max(32).optional(),
  vehicle_type:  z.string().max(64).optional().nullable(),
});

const vehicleIdParam = z.object({
  vehicle_id: z.coerce.number().int().positive(),
});

const subscribeBody = z.object({
  vehicle_id:  z.number().int().positive(),
  spot_id:     z.number().int().positive().optional().nullable(),
  tariff_id:   z.number().int().positive().optional().nullable(),
  valid_from:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  valid_to:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  monthly_fee: z.number().nonnegative().optional().nullable(),
});

const updateProfileBody = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone:     z.string().max(64).optional().nullable(),
});

// ─── PUBLIC: Customer self-registration ──────────────────────────────────────

router.post('/register', validateBody(registerBody), async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Check if email is already in users table
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Create auth user with customer role
    const passwordHash = await bcrypt.hash(password, 12);
    const userRes = await query(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'customer')",
      [email, passwordHash]
    );
    const userId = userRes.insertId;

    // Create linked customer profile
    await query(
      'INSERT INTO customers (full_name, email, phone) VALUES (?, ?, ?)',
      [full_name, email, phone ?? null]
    );

    // Sign and return JWT
    const user = await queryOne('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    const token = authService.signToken(user);

    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
});

// ─── All routes below require auth + a linked customer profile ────────────────

const protect = [requireAuth, requireCustomer];

// ── Profile ──────────────────────────────────────────────────────────────────

router.get('/profile', ...protect, (req, res) => {
  res.json({ success: true, data: req.customer });
});

router.patch('/profile', ...protect, validateBody(updateProfileBody), async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;
    const fields = [];
    const values = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (phone !== undefined)     { fields.push('phone = ?');     values.push(phone); }
    if (fields.length) {
      values.push(req.customer.id);
      await query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    const updated = await queryOne('SELECT * FROM customers WHERE id = ?', [req.customer.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ── Vehicles ─────────────────────────────────────────────────────────────────

router.get('/vehicles', ...protect, async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM vehicles WHERE customer_id = ? ORDER BY id DESC',
      [req.customer.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/vehicles', ...protect, validateBody(addVehicleBody), async (req, res, next) => {
  try {
    const { license_plate, vehicle_type } = req.body;

    const existing = await queryOne('SELECT id FROM vehicles WHERE license_plate = ?', [license_plate]);
    if (existing) throw new AppError('License plate already registered', 409, 'PLATE_EXISTS');

    const res2 = await query(
      'INSERT INTO vehicles (customer_id, license_plate, vehicle_type) VALUES (?, ?, ?)',
      [req.customer.id, license_plate, vehicle_type ?? null]
    );
    const vehicle = await queryOne('SELECT * FROM vehicles WHERE id = ?', [res2.insertId]);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/vehicles/:vehicle_id',
  ...protect,
  validateParams(vehicleIdParam),
  validateBody(updateVehicleBody),
  async (req, res, next) => {
    try {
      const { vehicle_id } = req.params;
      const vehicle = await queryOne(
        'SELECT * FROM vehicles WHERE id = ? AND customer_id = ?',
        [vehicle_id, req.customer.id]
      );
      if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');

      const { license_plate, vehicle_type } = req.body;
      const fields = [];
      const values = [];
      if (license_plate !== undefined) { fields.push('license_plate = ?'); values.push(license_plate); }
      if (vehicle_type !== undefined)  { fields.push('vehicle_type = ?');  values.push(vehicle_type); }
      if (fields.length) {
        values.push(vehicle_id);
        await query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      const updated = await queryOne('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/vehicles/:vehicle_id', ...protect, validateParams(vehicleIdParam), async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;
    const vehicle = await queryOne(
      'SELECT * FROM vehicles WHERE id = ? AND customer_id = ?',
      [vehicle_id, req.customer.id]
    );
    if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
    await query('DELETE FROM vehicles WHERE id = ?', [vehicle_id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── Available spots (for spot browsing / subscription) ────────────────────────

router.get('/spots/available', ...protect, async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT sp.*, pl.name AS level_name, pl.floor_number
      FROM parking_spots sp
      JOIN parking_levels pl ON pl.id = sp.level_id
      WHERE sp.status = 'available'
      ORDER BY pl.floor_number ASC, sp.spot_code ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── Tariffs (public pricing info for subscriptions) ───────────────────────────

router.get('/tariffs', ...protect, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT id, name, rate_per_hour, vat_percent, currency FROM tariffs WHERE is_active = 1 ORDER BY rate_per_hour ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── Subscriptions ─────────────────────────────────────────────────────────────

router.get('/subscriptions', ...protect, async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT s.*, v.license_plate, sp.spot_code, pl.name AS level_name, t.name AS tariff_name
      FROM subscriptions s
      JOIN vehicles v ON v.id = s.vehicle_id
      LEFT JOIN parking_spots sp ON sp.id = s.spot_id
      LEFT JOIN parking_levels pl ON pl.id = sp.level_id
      LEFT JOIN tariffs t ON t.id = s.tariff_id
      WHERE s.customer_id = ?
      ORDER BY s.id DESC
    `, [req.customer.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions', ...protect, validateBody(subscribeBody), async (req, res, next) => {
  try {
    const { vehicle_id, spot_id, tariff_id, valid_from, valid_to, monthly_fee } = req.body;

    // Verify the vehicle belongs to this customer
    const vehicle = await queryOne(
      'SELECT id FROM vehicles WHERE id = ? AND customer_id = ?',
      [vehicle_id, req.customer.id]
    );
    if (!vehicle) throw new AppError('Vehicle not found or does not belong to you', 404, 'NOT_FOUND');

    // If a spot was chosen, verify it is available
    if (spot_id) {
      const spot = await queryOne(
        "SELECT id, status FROM parking_spots WHERE id = ? AND status = 'available'",
        [spot_id]
      );
      if (!spot) throw new AppError('Selected spot is not available', 409, 'SPOT_NOT_AVAILABLE');
      // Reserve the spot
      await query("UPDATE parking_spots SET status = 'reserved' WHERE id = ?", [spot_id]);
    }

    const result = await query(
      `INSERT INTO subscriptions (customer_id, vehicle_id, spot_id, tariff_id, valid_from, valid_to, status, monthly_fee, auto_invoice)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0)`,
      [req.customer.id, vehicle_id, spot_id ?? null, tariff_id ?? null, valid_from, valid_to, monthly_fee ?? null]
    );

    const sub = await queryOne(`
      SELECT s.*, v.license_plate, sp.spot_code, pl.name AS level_name, t.name AS tariff_name
      FROM subscriptions s
      JOIN vehicles v ON v.id = s.vehicle_id
      LEFT JOIN parking_spots sp ON sp.id = s.spot_id
      LEFT JOIN parking_levels pl ON pl.id = sp.level_id
      LEFT JOIN tariffs t ON t.id = s.tariff_id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// Cancel own subscription
router.patch('/subscriptions/:id/cancel', ...protect, validateParams(z.object({ id: z.coerce.number().int().positive() })), async (req, res, next) => {
  try {
    const sub = await queryOne(
      'SELECT * FROM subscriptions WHERE id = ? AND customer_id = ?',
      [req.params.id, req.customer.id]
    );
    if (!sub) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    if (sub.status === 'cancelled') throw new AppError('Already cancelled', 400, 'ALREADY_CANCELLED');

    await query("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?", [sub.id]);
    // Free the reserved spot if any
    if (sub.spot_id) {
      await query("UPDATE parking_spots SET status = 'available' WHERE id = ? AND status = 'reserved'", [sub.spot_id]);
    }
    const updated = await queryOne('SELECT * FROM subscriptions WHERE id = ?', [sub.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get('/sessions', ...protect, async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT ps.*, v.license_plate, sp.spot_code, pl.name AS level_name, t.name AS tariff_name
      FROM parking_sessions ps
      JOIN vehicles v ON v.id = ps.vehicle_id
      JOIN parking_spots sp ON sp.id = ps.spot_id
      JOIN parking_levels pl ON pl.id = sp.level_id
      LEFT JOIN tariffs t ON t.id = ps.tariff_id
      WHERE v.customer_id = ?
      ORDER BY ps.id DESC
      LIMIT 50
    `, [req.customer.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── Invoices ──────────────────────────────────────────────────────────────────

router.get('/invoices', ...protect, async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT i.*
      FROM invoices i
      LEFT JOIN parking_sessions ps ON ps.id = i.parking_session_id
      LEFT JOIN vehicles v_sess ON v_sess.id = ps.vehicle_id
      LEFT JOIN subscriptions sub ON sub.id = i.subscription_id
      WHERE v_sess.customer_id = ? OR sub.customer_id = ?
      ORDER BY i.id DESC
      LIMIT 50
    `, [req.customer.id, req.customer.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/invoices/:id/pay',
  ...protect,
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  validateBody(z.object({
    cardholder_name: z.string().min(1).max(255),
    card_last4:      z.string().length(4).regex(/^\d{4}$/),
    card_brand:      z.string().max(32).optional(),
  })),
  async (req, res, next) => {
    try {
      const invoiceId = Number(req.params.id);

      // Ownership check
      const inv = await queryOne(`
        SELECT i.*, v_sess.customer_id AS sess_cust, sub.customer_id AS sub_cust
        FROM invoices i
        LEFT JOIN parking_sessions ps ON ps.id = i.parking_session_id
        LEFT JOIN vehicles v_sess ON v_sess.id = ps.vehicle_id
        LEFT JOIN subscriptions sub ON sub.id = i.subscription_id
        WHERE i.id = ?
      `, [invoiceId]);

      if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      if (inv.sess_cust !== req.customer.id && inv.sub_cust !== req.customer.id) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }
      if (inv.status !== 'pending') {
        throw new AppError(
          inv.status === 'paid' ? 'Invoice already paid' : 'Invoice cannot be paid',
          409, 'INVALID_STATUS'
        );
      }

      const { cardholder_name, card_last4, card_brand = 'VISA' } = req.body;
      const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const result = await withTransaction(async (conn) => {
        // Record payment
        const payment = await paymentRepo.insert({
          invoice_id:      invoiceId,
          amount:          inv.total,
          method:          `${card_brand} ****${card_last4}`,
          transaction_ref: transactionRef,
          status:          'completed',
        }, conn);

        // Mark invoice paid
        await invoiceRepo.updateStatus(invoiceId, 'paid', conn);

        return payment;
      });

      res.json({ success: true, data: { payment: result, transaction_ref: transactionRef } });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/invoices/:id/download',
  ...protect,
  validateParams(z.object({ id: z.coerce.number().int().positive() })),
  async (req, res, next) => {
    try {
      const inv = await invoiceRepo.findById(Number(req.params.id));
      if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

      // Ownership check — invoice must belong to this customer
      const ownedBySession = inv.parking_session_id
        ? await queryOne(
            `SELECT 1 FROM parking_sessions ps
             JOIN vehicles v ON v.id = ps.vehicle_id
             WHERE ps.id = ? AND v.customer_id = ?`,
            [inv.parking_session_id, req.customer.id]
          )
        : null;

      const ownedBySub = inv.subscription_id
        ? await queryOne(
            'SELECT 1 FROM subscriptions WHERE id = ? AND customer_id = ?',
            [inv.subscription_id, req.customer.id]
          )
        : null;

      if (!ownedBySession && !ownedBySub) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      const pdfBuffer = await generateInvoicePdf(inv);
      const filename  = `INV-${String(inv.id).padStart(4, '0')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

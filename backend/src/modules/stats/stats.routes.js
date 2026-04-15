const { Router } = require('express');
const { queryOne, query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

/**
 * GET /api/stats
 * Dashboard aggregate: spot counts, sessions, revenue, invoices, incidents.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // Spot totals
    const spots = await queryOne(`
      SELECT
        COUNT(*)                          AS total_spots,
        SUM(status = 'available')         AS available_spots,
        SUM(status = 'occupied')          AS occupied_spots,
        SUM(status = 'reserved')          AS reserved_spots,
        SUM(status = 'maintenance')       AS maintenance_spots
      FROM parking_spots
    `);

    // Active sessions
    const sessions = await queryOne(
      `SELECT COUNT(*) AS active_sessions FROM parking_sessions WHERE status = 'active'`
    );

    // Monthly revenue (completed payments this calendar month)
    const revenue = await queryOne(`
      SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
      FROM payments
      WHERE status = 'completed'
        AND YEAR(paid_at)  = YEAR(NOW())
        AND MONTH(paid_at) = MONTH(NOW())
    `);

    // Pending invoices
    const invoices = await queryOne(
      `SELECT COUNT(*) AS pending_invoices FROM invoices WHERE status = 'pending'`
    );

    // Open incidents
    const incidents = await queryOne(
      `SELECT COUNT(*) AS open_incidents FROM incidents WHERE status = 'open'`
    );

    // Total customers & vehicles
    const customers = await queryOne(`SELECT COUNT(*) AS total_customers FROM customers`);
    const vehicles  = await queryOne(`SELECT COUNT(*) AS total_vehicles FROM vehicles`);

    // Active subscriptions
    const subscriptions = await queryOne(
      `SELECT COUNT(*) AS active_subscriptions FROM subscriptions WHERE status = 'active'`
    );

    // Recent sessions (activity feed — last 8, joined)
    const recentSessions = await query(`
      SELECT
        ps.id, ps.status, ps.started_at, ps.ended_at,
        v.license_plate,
        sp.spot_code,
        pl.name AS level_name
      FROM parking_sessions ps
      JOIN vehicles v  ON v.id  = ps.vehicle_id
      JOIN parking_spots sp ON sp.id = ps.spot_id
      JOIN parking_levels pl ON pl.id = sp.level_id
      ORDER BY ps.created_at DESC
      LIMIT 8
    `);

    // Recent incidents (activity feed — last 4, open)
    const recentIncidents = await query(`
      SELECT i.id, i.title, i.severity, i.status, i.reported_at, v.license_plate
      FROM incidents i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      ORDER BY i.created_at DESC
      LIMIT 4
    `);

    res.json({
      success: true,
      data: {
        spots: {
          total:       Number(spots.total_spots       ?? 0),
          available:   Number(spots.available_spots   ?? 0),
          occupied:    Number(spots.occupied_spots    ?? 0),
          reserved:    Number(spots.reserved_spots    ?? 0),
          maintenance: Number(spots.maintenance_spots ?? 0),
        },
        active_sessions:      Number(sessions.active_sessions      ?? 0),
        monthly_revenue:      Number(revenue.monthly_revenue        ?? 0),
        pending_invoices:     Number(invoices.pending_invoices      ?? 0),
        open_incidents:       Number(incidents.open_incidents       ?? 0),
        total_customers:      Number(customers.total_customers      ?? 0),
        total_vehicles:       Number(vehicles.total_vehicles        ?? 0),
        active_subscriptions: Number(subscriptions.active_subscriptions ?? 0),
        recent_sessions:  recentSessions,
        recent_incidents: recentIncidents,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

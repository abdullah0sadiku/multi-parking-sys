const { Router } = require('express');
const { query, queryOne } = require('../../config/database');
const bcrypt = require('bcryptjs');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { AppError } = require('../../utils/AppError');
const { z } = require('zod');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');

const router = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  page:   z.coerce.number().int().min(1).optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  role:   z.enum(['admin', 'staff']).optional(),
});

const updateBody = z.object({
  role: z.enum(['admin', 'staff']),
});

/**
 * GET /api/users
 * List all system users (admin + staff accounts). Admin only.
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  validateQuery(listQuery),
  async (req, res, next) => {
    try {
      const page  = Number(req.query.page  ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const offset = (page - 1) * limit;
      const { search, role } = req.query;

      let sql = 'SELECT SQL_CALC_FOUND_ROWS id, email, role, created_at, updated_at FROM users WHERE 1=1';
      const params = [];

      if (search) {
        sql += ' AND email LIKE ?';
        params.push(`%${search}%`);
      }
      if (role) {
        sql += ' AND role = ?';
        params.push(role);
      }

      sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await query(sql, params);
      const totalRow = await queryOne('SELECT FOUND_ROWS() AS total');
      const total = Number(totalRow.total);

      res.json({
        success: true,
        items: rows,
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/users/:id
 * Get a single user by id. Admin only.
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateParams(idParam),
  async (req, res, next) => {
    try {
      const user = await queryOne(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [req.params.id]
      );
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/users/:id
 * Update a user's role. Admin only.
 */
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateParams(idParam),
  validateBody(updateBody),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const existing = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');

      await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

      const updated = await queryOne(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete a user account. Admin only. Cannot delete yourself.
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateParams(idParam),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (Number(id) === Number(req.user.id)) {
        throw new AppError('You cannot delete your own account', 400, 'SELF_DELETE');
      }

      const existing = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');

      await query('DELETE FROM users WHERE id = ?', [id]);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

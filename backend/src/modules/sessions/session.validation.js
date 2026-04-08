const { z } = require('zod');

const sessionStatus = z.enum(['active', 'completed', 'cancelled']);

const startBody = z.object({
  license_plate: z.string().min(1).max(32),
  spot_id:       z.number().int().positive().optional(),
  tariff_id:     z.number().int().positive().optional(),
  notes:         z.string().optional().nullable(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  vehicle_id: z.coerce.number().int().positive().optional(),
  spot_id: z.coerce.number().int().positive().optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  status: sessionStatus.optional(),
  search: z.string().optional(),
});

const payBody = z.object({
  method: z.enum(['POS', 'Cash', 'Card']),
});

module.exports = { startBody, idParam, listQuery, payBody };

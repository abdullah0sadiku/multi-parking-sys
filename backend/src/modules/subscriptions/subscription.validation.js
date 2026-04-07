const { z } = require('zod');

const subStatus = z.enum(['active', 'expired', 'cancelled']);

const createBody = z.object({
  customer_id: z.number().int().positive(),
  vehicle_id: z.number().int().positive(),
  spot_id: z.number().int().positive().optional().nullable(),
  tariff_id: z.number().int().positive().optional().nullable(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: subStatus.optional(),
  monthly_fee: z.number().nonnegative().optional().nullable(),
  auto_invoice: z.boolean().optional(),
});

const updateBody = z.object({
  customer_id: z.number().int().positive().optional(),
  vehicle_id: z.number().int().positive().optional(),
  spot_id: z.number().int().positive().optional().nullable(),
  tariff_id: z.number().int().positive().optional().nullable(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: subStatus.optional(),
  monthly_fee: z.number().nonnegative().optional().nullable(),
  auto_invoice: z.boolean().optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  vehicle_id: z.coerce.number().int().positive().optional(),
  status: subStatus.optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

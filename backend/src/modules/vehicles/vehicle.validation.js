const { z } = require('zod');

const createBody = z.object({
  customer_id: z.number().int().positive(),
  license_plate: z.string().min(1).max(32),
  vehicle_type: z.string().max(64).optional().nullable(),
});

const updateBody = z.object({
  customer_id: z.number().int().positive().optional(),
  license_plate: z.string().min(1).max(32).optional(),
  vehicle_type: z.string().max(64).optional().nullable(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

const { z } = require('zod');

const spotStatus = z.enum(['available', 'occupied', 'reserved', 'maintenance']);

const createBody = z.object({
  level_id: z.number().int().positive(),
  spot_code: z.string().min(1).max(64),
  status: spotStatus.optional(),
});

const updateBody = z.object({
  level_id: z.number().int().positive().optional(),
  spot_code: z.string().min(1).max(64).optional(),
  status: spotStatus.optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  level_id: z.coerce.number().int().positive().optional(),
  status: spotStatus.optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

const { z } = require('zod');

const createBody = z.object({
  name: z.string().min(1).max(255),
  rate_per_hour: z.number().nonnegative(),
  vat_percent: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
});

const updateBody = z.object({
  name: z.string().min(1).max(255).optional(),
  rate_per_hour: z.number().nonnegative().optional(),
  vat_percent: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

const { z } = require('zod');

const barrierStatus = z.enum(['operational', 'maintenance', 'offline']);

const createBody = z.object({
  level_id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  location_note: z.string().max(255).optional().nullable(),
  status: barrierStatus.optional(),
});

const updateBody = z.object({
  level_id: z.number().int().positive().optional(),
  name: z.string().min(1).max(255).optional(),
  location_note: z.string().max(255).optional().nullable(),
  status: barrierStatus.optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  level_id: z.coerce.number().int().positive().optional(),
  status: barrierStatus.optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

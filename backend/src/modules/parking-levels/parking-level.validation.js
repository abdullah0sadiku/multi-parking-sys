const { z } = require('zod');

const createBody = z.object({
  name: z.string().min(1).max(255),
  prefix: z.string().min(1).max(10).toUpperCase(),
  floor_number: z.number().int(),
  capacity: z.number().int().min(1).max(500),
  description: z.string().optional().nullable(),
});

const updateBody = z.object({
  name: z.string().min(1).max(255).optional(),
  prefix: z.string().min(1).max(10).toUpperCase().optional(),
  floor_number: z.number().int().optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

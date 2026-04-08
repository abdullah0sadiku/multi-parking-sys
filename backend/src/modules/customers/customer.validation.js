const { z } = require('zod');

const createBody = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
});

const updateBody = z.object({
  full_name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
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

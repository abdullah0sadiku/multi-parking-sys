const { z } = require('zod');

const paymentStatus = z.enum(['completed', 'failed', 'refunded']);

const createBody = z.object({
  invoice_id: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.string().min(1).max(64),
  transaction_ref: z.string().max(255).optional().nullable(),
  paid_at: z.coerce.date().optional(),
  status: paymentStatus.optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  invoice_id: z.coerce.number().int().positive().optional(),
  status: paymentStatus.optional(),
});

module.exports = { createBody, idParam, listQuery };

const { z } = require('zod');

const invoiceStatus = z.enum(['pending', 'paid', 'cancelled']);

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  status: invoiceStatus.optional(),
  search: z.string().optional(),
});

module.exports = { idParam, listQuery };

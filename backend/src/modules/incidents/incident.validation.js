const { z } = require('zod');

const severity = z.enum(['low', 'medium', 'high', 'critical']);
const incidentStatus = z.enum(['open', 'resolved', 'closed']);

const createBody = z.object({
  vehicle_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  severity: severity.optional(),
  status: incidentStatus.optional(),
  reported_at: z.coerce.date().optional(),
});

const updateBody = z.object({
  vehicle_id: z.number().int().positive().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  severity: severity.optional(),
  status: incidentStatus.optional(),
  reported_at: z.coerce.date().optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  vehicle_id: z.coerce.number().int().positive().optional(),
  status: incidentStatus.optional(),
  severity: severity.optional(),
  search: z.string().optional(),
});

module.exports = { createBody, updateBody, idParam, listQuery };

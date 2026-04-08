const { z } = require('zod');

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'staff']).optional(),
});

const bootstrapBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

module.exports = { loginBody, registerBody, bootstrapBody };

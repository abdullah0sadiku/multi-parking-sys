const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const { AppError } = require('../../utils/AppError');
const authRepo = require('./auth.repository');

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

async function login(email, password) {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  const token = signToken(user);
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

async function register(email, password, role = 'staff') {
  const existing = await authRepo.findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await authRepo.create({ email, passwordHash, role });
  const token = signToken(user);
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

async function getProfile(userId) {
  const user = await authRepo.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
}

/** One-time: create first admin when users table is empty */
async function bootstrapAdmin(email, password) {
  const count = await authRepo.countUsers();
  if (count > 0) {
    throw new AppError('Bootstrap is only allowed when no users exist', 403, 'BOOTSTRAP_DISABLED');
  }
  return register(email, password, 'admin');
}

module.exports = { login, register, getProfile, signToken, bootstrapAdmin };

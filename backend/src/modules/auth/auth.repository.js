const { query, queryOne } = require('../../config/database');

async function findByEmail(email) {
  return queryOne('SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?', [email]);
}

async function findById(id) {
  return queryOne('SELECT id, email, role, created_at FROM users WHERE id = ?', [id]);
}

async function create({ email, passwordHash, role }) {
  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    [email, passwordHash, role]
  );
  return findById(result.insertId);
}

async function countUsers() {
  const row = await queryOne('SELECT COUNT(*) AS c FROM users');
  return Number(row.c);
}

module.exports = { findByEmail, findById, create, countUsers };

const mysql = require('mysql2/promise');
const { env } = require('./env');
const { logger } = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      waitForConnections: true,
      connectionLimit: env.mysql.connectionLimit,
    });
  }
  return pool;
}

async function query(sql, params) {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

async function withTransaction(fn) {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/** Run SQL on pool or an existing transaction connection */
async function run(conn, sql, params = []) {
  if (conn) {
    const [rows] = await conn.execute(sql, params);
    return rows;
  }
  return query(sql, params);
}

async function runOne(conn, sql, params = []) {
  const rows = await run(conn, sql, params);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

module.exports = { getPool, query, queryOne, withTransaction, run, runOne };

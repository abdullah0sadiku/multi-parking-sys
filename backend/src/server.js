const { app } = require('./app');
const { env } = require('./config/env');
const { logger } = require('./utils/logger');
const { query } = require('./config/database');

async function runMigration(label, sql) {
  try {
    await query(sql);
    logger.info(`DB migration: ${label}`);
  } catch (err) {
    // Ignore "already applied" errors so startup is always safe.
    const ignoredCodes = ['ER_DUP_FIELDNAME', 'ER_CANT_DROP_FIELD_OR_KEY', 'ER_DUP_KEYNAME'];
    if (!ignoredCodes.includes(err.code)) {
      logger.warn(`DB migration note [${label}]:`, { message: err.message });
    }
  }
}

async function runMigrations() {
  // 1. Extend users.role enum to include 'customer'
  await runMigration(
    'users.role enum → customer',
    `ALTER TABLE users MODIFY COLUMN role ENUM('admin','staff','customer') NOT NULL DEFAULT 'staff'`
  );

  // 2. Make vehicles.customer_id nullable so walk-in vehicles can be created
  //    without a registered customer account.
  await runMigration(
    'vehicles.customer_id → nullable',
    `ALTER TABLE vehicles MODIFY COLUMN customer_id INT UNSIGNED NULL`
  );

  // 3. Re-create the FK with ON DELETE SET NULL (so deleting a customer only
  //    unlinks their vehicles rather than cascading deletion).
  await runMigration(
    'vehicles FK drop old',
    `ALTER TABLE vehicles DROP FOREIGN KEY fk_vehicles_customer`
  );
  await runMigration(
    'vehicles FK add SET NULL',
    `ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_customer
     FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL`
  );

  // 4. Add tariff type: 'session' (bracket-priced walk-ins) vs 'subscription' (monthly rate).
  await runMigration(
    'tariffs.type column',
    `ALTER TABLE tariffs ADD COLUMN type ENUM('session','subscription') NOT NULL DEFAULT 'subscription'`
  );

  // 5. Add pricing_brackets JSON for session tariffs.
  await runMigration(
    'tariffs.pricing_brackets column',
    `ALTER TABLE tariffs ADD COLUMN pricing_brackets JSON NULL`
  );

  // 6. Seed the default walk-in session tariff if none exists yet.
  await runMigration(
    'seed walk-in session tariff',
    `INSERT INTO tariffs (name, rate_per_hour, vat_percent, currency, is_active, type, pricing_brackets)
     SELECT 'Walk-in Standard', 0.00, 0, 'USD', 1, 'session',
       '[{"max_minutes":15,"label":"0 – 15 min","price":0},{"max_minutes":120,"label":"Up to 2 hrs","price":2},{"max_minutes":300,"label":"Up to 5 hrs","price":5},{"max_minutes":720,"label":"Up to 12 hrs","price":9}]'
     FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM tariffs WHERE type = 'session')`
  );
}

runMigrations().then(() => {
  const server = app.listen(env.port, () => {
    logger.info(`Parking API listening on port ${env.port}`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    process.exit(1);
  });
});

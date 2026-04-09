const { queryOne } = require('../../config/database');
const { AppError } = require('../../utils/AppError');

/**
 * requireCustomer
 * Must be used AFTER requireAuth.
 * Looks up the customers row whose email matches the JWT user's email,
 * then attaches it as req.customer so portal handlers know which customer
 * they are operating on behalf of.
 */
async function requireCustomer(req, res, next) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    const customer = await queryOne(
      'SELECT * FROM customers WHERE email = ? LIMIT 1',
      [req.user.email]
    );
    if (!customer) {
      return next(
        new AppError(
          'No customer profile found for this account. Please contact support.',
          404,
          'CUSTOMER_NOT_FOUND'
        )
      );
    }
    req.customer = customer;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireCustomer };

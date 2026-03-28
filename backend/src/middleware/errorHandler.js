const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.isOperational ? err.message : status === 500 ? 'Internal server error' : err.message;

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
  } else {
    logger.warn(err.message, { path: req.path, code });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && status === 500 && err.stack ? { stack: err.stack } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };

const winston = require('winston');
const { env } = require('../config/env');

const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}${extra}`;
        })
      ),
    }),
  ],
});

module.exports = { logger };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger } = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const statsRoutes = require('./modules/stats/stats.routes');
const parkingRoutes = require('./modules/parking/parking.routes');
const parkingLevelRoutes = require('./modules/parking-levels/parking-level.routes');
const parkingSpotRoutes = require('./modules/parking-spots/parking-spot.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const tariffRoutes = require('./modules/tariffs/tariff.routes');
const sessionRoutes = require('./modules/sessions/session.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');
const invoiceRoutes = require('./modules/invoices/invoice.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const barrierRoutes = require('./modules/barriers/barrier.routes');
const incidentRoutes = require('./modules/incidents/incident.routes');
const userRoutes = require('./modules/users/user.routes');
const portalRoutes = require('./modules/portal/portal.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/parking-levels', parkingLevelRoutes);
app.use('/api/parking-spots', parkingSpotRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tariffs', tariffRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/barriers', barrierRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portal', portalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };

import express from 'express';
import { securityHeadersMiddleware } from './middleware/security.ts';
import { settingsRouter } from './routes/settings.ts';
import { servicesRouter } from './routes/services.ts';
import { barbersRouter } from './routes/barbers.ts';
import { bookingsRouter } from './routes/bookings.ts';
import { transactionsRouter } from './routes/transactions.ts';
import { aiRouter } from './routes/ai.ts';
import { blueprintsRouter } from './routes/blueprints.ts';
import { authRouter } from './routes/auth.ts';
import { serverStore } from './state.ts';
import { serverConfig } from './config.ts';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const settings = serverStore.getSettings();
    res.json({
      status: 'ok',
      shop: settings.shopName,
      bookingOpen: settings.isBookingOpen,
      env: serverConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/settings', settingsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/barbers', barbersRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/ai-consultant', aiRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', blueprintsRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  });

  app.use(
    '/api',
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[API Error]:', err);
      res.status(500).json({
        error: 'Terjadi kesalahan pada server.',
        message: serverConfig.isProduction ? 'Internal server error' : err.message,
      });
    },
  );

  return app;
}

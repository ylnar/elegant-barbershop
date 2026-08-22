import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { securityHeadersMiddleware } from './server/middleware/security.ts';
import { settingsRouter } from './server/routes/settings.ts';
import { servicesRouter } from './server/routes/services.ts';
import { barbersRouter } from './server/routes/barbers.ts';
import { bookingsRouter } from './server/routes/bookings.ts';
import { transactionsRouter } from './server/routes/transactions.ts';
import { aiRouter } from './server/routes/ai.ts';
import { blueprintsRouter } from './server/routes/blueprints.ts';
import { authRouter } from './server/routes/auth.ts';
import { serverStore } from './server/state.ts';
import { runAutoMigrate } from './server/dbAutoMigrate.ts';
import { serverConfig, printConfigSummary } from './server/config.ts';

async function startServer() {
  const app = express();

  // ── Tampilkan ringkasan config saat boot ──
  printConfigSummary();

  // ── 1. Global Middlewares ──
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── 2. Health check endpoint ──
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

  // ── 3. Modular API Routers ──
  app.use('/api/settings', settingsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/barbers', barbersRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/ai-consultant', aiRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', blueprintsRouter);

  // ── 4. Global Error Handler for API routes ──
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]:', err);
    res.status(500).json({
      error: 'Terjadi kesalahan pada server.',
      message: serverConfig.isProduction ? 'Internal server error' : err.message,
    });
  });

  // ── 5. Auto-migrate: terapkan migrasi pending saat boot ──
  await Promise.race([
    runAutoMigrate(),
    new Promise((resolve) => setTimeout(resolve, 60_000)),
  ]);

  // ── 6. Frontend Delivery (Vite in Dev, Static in Prod) ──
  if (serverConfig.isDevelopment) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── 7. Start listening ──
  app.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`\n[Elegant Barber] Server active on ${serverConfig.displayUrl}`);
    console.log(`                 Buka di browser → ${serverConfig.displayUrl}\n`);
  });
}

startServer();

import 'dotenv/config';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createApp } from './server/app.ts';
import { runAutoMigrate } from './server/dbAutoMigrate.ts';
import { serverConfig, printConfigSummary } from './server/config.ts';

async function startServer() {
  const app = createApp();

  // ── Tampilkan ringkasan config saat boot ──
  printConfigSummary();

  // ── Auto-migrate: terapkan migrasi pending saat boot ──
  await Promise.race([
    runAutoMigrate(),
    new Promise((resolve) => setTimeout(resolve, 60_000)),
  ]);

  // ── Frontend Delivery (Vite in Dev, Static in Prod) ──
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

  // ── Start listening ──
  app.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`\n[Elegant Barber] Server active on ${serverConfig.displayUrl}`);
    console.log(`                 Buka di browser → ${serverConfig.displayUrl}\n`);
  });
}

startServer();

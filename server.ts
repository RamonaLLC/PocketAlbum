import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import apiRouter from './server/routes.ts';
import { FacebookAutomationManager } from './server/facebookAutomation.ts';
import { NewsService } from './server/newsService.ts';

async function startServer() {
  // Initialize database schema and PCGS reference tables
  initDatabase();
  NewsService.initTables();

  const app = express();
  const PORT = 3000;

  // Body parsing middleware (supporting multi-photo uploads / base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Coin Collector' });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Coin Collector server running at http://0.0.0.0:${PORT}`);

    // Facebook Automation publishing queue background runner (runs every 30 seconds)
    setInterval(() => {
      FacebookAutomationManager.processFacebookQueue().catch((err) => {
        console.error('Facebook background queue runner error:', err);
      });
    }, 30000);

    // News Ingestion background runner (runs every 15 minutes)
    setInterval(() => {
      NewsService.fetchFromConnectedSources().catch((err) => {
        console.error('News background ingestion runner error:', err);
      });
    }, 15 * 60 * 1000);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

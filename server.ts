import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './server/db/index.ts';

import authRoutes from './server/routes/auth.ts';
import quizRoutes from './server/routes/quizzes.ts';
import attemptRoutes from './server/routes/attempts.ts';

dotenv.config();

const app = express();

// Priority: APP_BACKEND_PORT > 3005
// We explicitly AVOID using 'PORT' if it's 3000 to prevent conflict with Vite
const envPort = process.env.APP_BACKEND_PORT;
const port = envPort ? Number(envPort) : 3005;

console.log(`[INIT] Environment APP_BACKEND_PORT: ${envPort}`);
console.log(`[INIT] Calculated backend port: ${port}`);
console.log(`[INIT] Database initialized: ${!!db}`);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    port: port
  });
});

// Start server
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

if (!isTest) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[BACKEND] Running at http://localhost:${port}`);
  });
}

export { app };

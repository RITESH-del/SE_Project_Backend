import { fileURLToPath } from 'node:url';
import express from 'express';
import config from './config/env.js';
import errorHandler from './shared/middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.route.js';
import adminRoutes from './modules/admin/admin.route.js';

const app = express();

// CORS configuration supporting credentials from frontend origin
app.use((req, res, next) => {
  const allowedOrigin = config.CLIENT_URL || 'http://localhost:5173';
  const origin = req.headers.origin;

  if (!origin || origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Timetable API is healthy',
  });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Fallback 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

const isDirectRun = Boolean(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]);
if (process.env.NODE_ENV !== 'test' && isDirectRun) {
  const port = config.PORT || 8000;
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}

export { app };
export default app;

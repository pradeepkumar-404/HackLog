import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Routes
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import calendarLogRoutes from './routes/calendarLogRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import vulnerabilityRoutes from './routes/vulnerabilityRoutes.js';
import payloadRoutes from './routes/payloadRoutes.js';
import reconRoutes from './routes/reconRoutes.js';
import noteLinkRoutes from './routes/noteLinkRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import backupRoutes from './routes/backupRoutes.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:5001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:5000'],
  credentials: true,
}));

// ========== SERVE FRONTEND IN PRODUCTION ==========
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  console.log('[Server] Serving frontend from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
}
// =================================================

// Connect to SQLite
await connectDB();

// Routes
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar-logs', calendarLogRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/payloads', payloadRoutes);
app.use('/api/recon', reconRoutes);
app.use('/api/note-links', noteLinkRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/backup', backupRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== SPA FALLBACK (MUST BE LAST) ==========
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {

    // Skip API
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip assets
    if (
      req.path.startsWith('/assets/') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.svg') ||
      req.path.endsWith('.ico')
    ) {
      return next();
    }

    res.sendFile(
      path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
    );
  });
}
// =================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
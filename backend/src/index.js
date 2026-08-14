import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// ========== Init DB ==========
import { initDB } from './models/init.js';
initDB();

// ========== Middleware ==========
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== Static files ==========
const uploadsPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// ========== API routes ==========
import authRoutes from './routes/auth.js';
import cityRoutes from './routes/cities.js';
import photoRoutes from './routes/photos.js';
import journalRoutes from './routes/journals.js';

app.use('/api/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/journals', journalRoutes);

// ========== Health check ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ========== Error handler ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 5MB)' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ========== Start ==========
const server = app.listen(PORT, () => {
  console.log(`\n  Dream Travel Memory Backend`);
  console.log(`  ─────────────────────────`);
  console.log(`  Server: http://localhost:${PORT}`);
  console.log(`  API:    http://localhost:${PORT}/api`);
  console.log(`  Upload: ${uploadsPath}\n`);
});

// 优雅退出：收到终止信号时先关闭 HTTP 服务，避免重启时端口占用（EADDRINUSE）
function shutdown(signal) {
  console.log(`\n  ${signal} received, closing server...`);
  // 关闭空闲 keep-alive 连接，避免 server.close 一直等待导致端口不释放
  server.closeIdleConnections?.();
  server.close(() => {
    console.log("  Server closed.");
    process.exit(0);
  });
  // 兜底：3 秒后强制退出，防止有连接未关闭时挂住
  setTimeout(() => process.exit(0), 3000).unref?.();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

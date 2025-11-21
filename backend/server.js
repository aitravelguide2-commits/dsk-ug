import 'dotenv/config'; // Load env vars before ANY other import

console.log('=== START server.js - initial env SUPABASE_PROJECT_URL:', !!process.env.SUPABASE_PROJECT_URL);
console.log('ENV_KEYS_COUNT:', Object.keys(process.env).length);

// Background checker to see if env vars disappear
setInterval(() => {
  if (!process.env.SUPABASE_PROJECT_URL) {
    console.error('!!! SUPABASE_PROJECT_URL DISAPPEARED! Current keys:', Object.keys(process.env).slice(0,50));
    // console.trace(); // Trace might be too noisy in interval, but useful if it happens once
  }
}, 2000);

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import sequelize from './config/db.js';
// Modelle und Relationen initialisieren (Side-Effect Import)
import './models/index.js';
import routes from './routes/index.js';
import errorHandler from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables are provided by PM2 ecosystem.config.cjs
// No need to load .env file manually

console.log('🚀 Starting backend server...');
console.log('🔑 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  hasSupabaseURL: !!process.env.SUPABASE_PROJECT_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE,
  hasDBHost: !!process.env.DB_HOST,
  totalEnvKeys: Object.keys(process.env).length
});

const app = express();

// DEBUG: Intercept ALL requests immediately
app.use((req, res, next) => {
  console.log('🔍 DEBUG: Request received:', req.method, req.url);
  if (req.query.debug === 'true') {
    console.log('🔍 DEBUG: Sending debug response');
    return res.json({ 
      msg: 'Debug Middleware reached!', 
      env: !!process.env.SUPABASE_PROJECT_URL,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
  }
  next();
});

// CORS configuration
const allowedOrigins = [
  'https://traesyj8lzvf.vercel.app', // New Vercel URL
  'https://traesyj8lzvf-42yhsybim-aitravelguide2-commits-projects.vercel.app',
  'https://dsk-ug.de',
  'https://www.dsk-ug.de',
  'https://admin.dsk-ug.de',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000' // Alternative dev port
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists and serve static files
const uploadDir = path.join(__dirname, process.env.UPLOAD_PATH || 'uploads/images');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', cors(), express.static(uploadDir));

console.log('📂 Upload directory:', uploadDir);

// Initialise DB
try {
  console.log('🔌 Authenticating database connection...');
  await sequelize.authenticate();
  console.log('🔄 Synchronizing database schema...');
  await sequelize.sync();
  console.log('✅ DB synchronised');
} catch (err) {
  console.error('❌ DB connection failed:', err.message);
  console.error('Full error:', err);
}

// API routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err);
  console.error(err.stack); // Log full stack trace
  res.status(err.status || 500).json({ 
    msg: err.message || 'Serverfehler',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 API on http://localhost:${port}`);
});

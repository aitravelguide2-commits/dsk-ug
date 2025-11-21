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

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://traesyj8lzvf-42yhsybim-aitravelguide2-commits-projects.vercel.app',
  'http://localhost:5174',  // Customer frontend dev
  'http://localhost:5173',  // Admin frontend dev
  'http://localhost:3000',  // Alternative dev port
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

// Initialise DB
try {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('✅ DB synchronised');
} catch (err) {
  console.error('❌ DB connection failed:', err.message);
}

// API routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 API on http://localhost:${port}`);
});

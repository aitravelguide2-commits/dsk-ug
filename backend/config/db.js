import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Log environment variables at DB config time
console.log('🔍 DB Config Debug:', {
  DB_HOST: process.env.DB_HOST ? '✅ SET' : '❌ MISSING',
  DB_NAME: process.env.DB_NAME ? '✅ SET' : '❌ MISSING',
  DB_USER: process.env.DB_USER ? '✅ SET' : '❌ MISSING',
  DB_PASS: process.env.DB_PASS ? '✅ SET' : '❌ MISSING',
  allDBKeys: Object.keys(process.env).filter(k => k.startsWith('DB_'))
});

const hasMySQL = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER;

console.log(`🔧 Database Mode: ${hasMySQL ? 'MySQL' : 'SQLite'}`);

let sequelize;
if (hasMySQL) {
  console.log('📡 Connecting to MySQL...');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
  );
} else {
  console.log('📁 Using SQLite...');
  const dataDir = path.join(__dirname, '../data');
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) { /* ignore */ }
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dataDir, 'dev.sqlite'),
    logging: false,
  });
}

export default sequelize;

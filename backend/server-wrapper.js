// Hardcode environment variables BEFORE any other imports
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';
process.env.JWT_SECRET = '3f3b2f2a7c24c9b94b8a1c5b89d4e3a0c8fd72a7f4e1c2d3a5b6c7d8e9f0a1b2';
process.env.JWT_EXPIRE = '24h';
process.env.SUPABASE_PROJECT_URL = 'https://hgttnevlpcewtpotwkvc.supabase.co';
process.env.SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndHRuZXZscGNld3Rwb3R3a3ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4Njc3MiwiZXhwIjoyMDc3NzYyNzcyfQ.zXMqDUbqA5fznGNUbglXPaMGJTiDnsg--Z5FB1wTizA';

console.log('🔧 Environment variables hardcoded:');
console.log('  SUPABASE_PROJECT_URL:', process.env.SUPABASE_PROJECT_URL ? '✅ SET' : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE:', process.env.SUPABASE_SERVICE_ROLE ? '✅ SET' : '❌ MISSING');

// Now import the actual server
import('./server.js');

module.exports = {
  apps: [{
    name: 'backend-dsk',
    script: './server.js',
    cwd: '/var/www/backend-git/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      JWT_SECRET: '3f3b2f2a7c24c9b94b8a1c5b89d4e3a0c8fd72a7f4e1c2d3a5b6c7d8e9f0a1b2',
      JWT_EXPIRE: '24h',
      SUPABASE_PROJECT_URL: 'https://hgttnevlpcewtpotwkvc.supabase.co',
      SUPABASE_SERVICE_ROLE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndHRuZXZscGNld3Rwb3R3a3ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4Njc3MiwiZXhwIjoyMDc3NzYyNzcyfQ.zXMqDUbqA5fznGNUbglXPaMGJTiDnsg--Z5FB1wTizA'
    }
  }]
};

module.exports = {
  apps: [{
    name: 'backend-dsk',
    script: './server-wrapper.js', // Use the wrapper instead of server.js
    cwd: '/var/www/backend-git/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M'
  }]
};

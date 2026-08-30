const { spawn, execSync } = require('child_process');

console.log('==================================================');
console.log('🚀 Starting SmartSurplus Ecosystem (Backend + Frontend)');
console.log('==================================================');

// Cleanup old background processes on Ports 5000 and 5173 before start
const ports = [5000, 5173];
ports.forEach(port => {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const pids = output
      .split('\n')
      .map(line => line.trim().split(/\s+/).pop())
      .filter(pid => pid && pid !== '0' && !isNaN(pid) && parseInt(pid, 10) !== process.pid);

    [...new Set(pids)].forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`🧹 Cleared old background process on Port ${port} (PID ${pid})`);
      } catch (e) {}
    });
  } catch (e) {}
});

const backend = spawn('node', ['backend/server.js'], { stdio: 'inherit', shell: true });
const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});

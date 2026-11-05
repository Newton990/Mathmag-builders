// Simple static file server for Wasmer deployment
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'apps', 'web', 'dist');
const port = process.env.PORT || 8080;

function startServer() {
  console.log(`Serving ${distDir} on port ${port}`);
  const server = spawn('npx', ['serve', distDir, '-s', '-l', String(port)], { stdio: 'inherit', shell: true });
  server.on('exit', (code) => process.exit(code || 0));
}

if (!existsSync(distDir)) {
  console.log('Building web app...');
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: true, cwd: __dirname });
  build.on('exit', (code) => {
    if (code !== 0) process.exit(code || 1);
    startServer();
  });
} else {
  startServer();
}

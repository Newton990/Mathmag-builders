const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'apps', 'web', 'dist');
const port = process.env.PORT || 8080;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  res.end(content);
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    let filePath = path.normalize(path.join(distDir, rel));

    // Prevent directory traversal
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath);
      return;
    }

    // Don't SPA-fallback asset requests (avoids serving index.html as JS/CSS)
    if (path.extname(rel)) {
      res.writeHead(404); res.end('Not found'); return;
    }

    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      sendFile(res, indexPath);
    } else {
      res.writeHead(404); res.end('Not found');
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(port, () => {
  console.log(`Demo server running on port ${port}, dist=${distDir}`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(process.env.MBMS_PUBLIC_DIR || path.join(__dirname, 'public'));

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

// ---------------------------------------------------------------------------
// Security headers applied to every response
// ---------------------------------------------------------------------------
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Block MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Limit referrer information sent to third parties
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Restrict browser feature APIs
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // Content Security Policy:
  //   - default: same origin only
  //   - scripts: same origin + allow inline event handlers produced by Vite
  //   - styles: same origin + inline (Tailwind's runtime style injection)
  //   - fonts: same origin + data URIs (embedded Tailwind/icon fonts)
  //   - images: same origin + data URIs (SVG icons, logos)
  //   - connect: same origin (API proxy) + localhost for dev HMR
  //   - object/frame: blocked entirely
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

function addSecurityHeaders(res) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
}

function sendFile(res, filePath, headOnly = false) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  addSecurityHeaders(res);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
  });
  res.end(headOnly ? undefined : content);
}

async function handleApiRequest(req, res, apiHandler) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    body = Buffer.concat(chunks);
  }

  const request = new Request(requestUrl, {
    method: req.method,
    headers,
    ...(body === undefined ? {} : { body }),
  });
  const response = await apiHandler(request, process.env);

  addSecurityHeaders(res);
  const responseHeaders = {};
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie') responseHeaders[name] = value;
  });
  if (typeof response.headers.getSetCookie === 'function') {
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) responseHeaders['Set-Cookie'] = cookies;
  } else {
    const cookie = response.headers.get('set-cookie');
    if (cookie) responseHeaders['Set-Cookie'] = cookie;
  }
  res.writeHead(response.status, responseHeaders);
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
}

function handleStaticRequest(req, res) {
  try {
    const urlPath = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const filePath = path.resolve(publicDir, rel);

    // Prevent directory traversal
    if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${path.sep}`)) {
      addSecurityHeaders(res);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath, req.method === 'HEAD');
      return;
    }

    // Don't SPA-fallback asset requests (avoids serving index.html as JS/CSS)
    if (path.extname(rel) || (req.method !== 'GET' && req.method !== 'HEAD')) {
      addSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      sendFile(res, indexPath, req.method === 'HEAD');
    } else {
      addSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } catch (err) {
    console.error(err);
    addSecurityHeaders(res);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
}

async function startServer() {
  const { default: apiHandler } = await import('./apps/api/dist/edge.js');
  const port = Number(process.env.PORT) || 8080;
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      handleApiRequest(req, res, apiHandler).catch((err) => {
        console.error(err);
        addSecurityHeaders(res);
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
      });
      return;
    }
    handleStaticRequest(req, res);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`MBMS server listening on port ${port}, public=${publicDir}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MBMS server:', err);
  process.exitCode = 1;
});

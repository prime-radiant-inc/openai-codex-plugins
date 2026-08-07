const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');

// ========== WebSocket Protocol (RFC 6455) ==========

const OPCODES = { TEXT: 0x01, CLOSE: 0x08, PING: 0x09, PONG: 0x0A };
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_FRAME_PAYLOAD_BYTES = 10 * 1024 * 1024;
const FRAME_PAYLOAD_TOO_LARGE_MESSAGE = 'WebSocket frame payload exceeds maximum allowed size';

function computeAcceptKey(clientKey) {
  return crypto.createHash('sha1').update(clientKey + WS_MAGIC).digest('base64');
}

function encodeFrame(opcode, payload) {
  const fin = 0x80;
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = fin | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = fin | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = fin | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;

  const secondByte = buffer[1];
  const opcode = buffer[0] & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLen = secondByte & 0x7F;
  let offset = 2;

  if (!masked) throw new Error('Client frames must be masked');

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    const bigPayloadLen = buffer.readBigUInt64BE(2);
    if (bigPayloadLen > BigInt(MAX_FRAME_PAYLOAD_BYTES)) {
      throw new Error(FRAME_PAYLOAD_TOO_LARGE_MESSAGE);
    }
    payloadLen = Number(bigPayloadLen);
    offset = 10;
  }

  if (payloadLen > MAX_FRAME_PAYLOAD_BYTES) {
    throw new Error(FRAME_PAYLOAD_TOO_LARGE_MESSAGE);
  }

  const maskOffset = offset;
  const dataOffset = offset + 4;
  const totalLen = dataOffset + payloadLen;
  if (buffer.length < totalLen) return null;

  const mask = buffer.slice(maskOffset, dataOffset);
  const data = Buffer.alloc(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    data[i] = buffer[dataOffset + i] ^ mask[i % 4];
  }

  return { opcode, payload: data, bytesConsumed: totalLen };
}

// ========== Configuration ==========

const HOST = process.env.BRAINSTORM_HOST || '127.0.0.1';
const URL_HOST = process.env.BRAINSTORM_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
const SESSION_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';
const CONTENT_DIR = path.join(SESSION_DIR, 'content');
const STATE_DIR = path.join(SESSION_DIR, 'state');
const PORT_FILE = process.env.BRAINSTORM_PORT_FILE || null;
const TOKEN_FILE = process.env.BRAINSTORM_TOKEN_FILE || null;
let ownerPid = process.env.BRAINSTORM_OWNER_PID ? Number(process.env.BRAINSTORM_OWNER_PID) : null;
let actualPort = null;
let SESSION_TOKEN = null;

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

// ========== Templates and Constants ==========

const WAITING_PAGE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Brainstorm Companion</title>
<style>body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1 { color: #333; } p { color: #666; }</style>
</head>
<body><h1>Brainstorm Companion</h1>
<p>Waiting for the agent to push a screen...</p></body></html>`;

const frameTemplate = fs.readFileSync(path.join(__dirname, 'frame-template.html'), 'utf-8');
const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
const helperInjection = '<script>\n' + helperScript + '\n</script>';

// ========== Helper Functions ==========

function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function wrapInFrame(content) {
  return frameTemplate.replace('<!-- CONTENT -->', content);
}

function getNewestScreen() {
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => {
      const fp = path.join(CONTENT_DIR, f);
      return { path: fp, mtime: fs.statSync(fp).mtime.getTime() };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].path : null;
}

function positiveMsFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const IDLE_TIMEOUT_MS = positiveMsFromEnv('BRAINSTORM_IDLE_TIMEOUT_MS', 4 * 60 * 60 * 1000);
const LIFECYCLE_CHECK_MS = positiveMsFromEnv('BRAINSTORM_LIFECYCLE_CHECK_MS', 60 * 1000);

function randomHighPort() {
  return 49152 + Math.floor(Math.random() * 16383);
}

function validPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
}

function validPersistedToken(value) {
  const token = String(value || '').trim();
  return /^[0-9a-f]{64}$/i.test(token) ? token : null;
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (e) {
    return null;
  }
}

function chmodOwnerOnly(filePath) {
  try {
    fs.chmodSync(filePath, 0o600);
  } catch (e) {
    // Best effort: Windows and some filesystems may not support POSIX modes.
  }
}

function writeOwnerOnlyFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, { mode: 0o600 });
  chmodOwnerOnly(filePath);
}

function selectPort() {
  const explicitPort = validPort(process.env.BRAINSTORM_PORT);
  if (explicitPort !== null) {
    return { port: explicitPort, source: 'env', preferred: true, persist: Boolean(PORT_FILE) };
  }

  if (PORT_FILE) {
    const filePort = validPort(readTextFile(PORT_FILE));
    if (filePort !== null) {
      return { port: filePort, source: 'file', preferred: true, persist: true };
    }
    return { port: randomHighPort(), source: 'generated', preferred: true, persist: true };
  }

  return { port: randomHighPort(), source: 'generated', preferred: false, persist: false };
}

function selectToken() {
  if (process.env.BRAINSTORM_TOKEN) {
    return { token: process.env.BRAINSTORM_TOKEN, source: 'env', persist: false };
  }

  if (TOKEN_FILE) {
    const token = validPersistedToken(readTextFile(TOKEN_FILE));
    if (token) {
      chmodOwnerOnly(TOKEN_FILE);
      return { token, source: 'file', persist: true };
    }
    return { token: crypto.randomBytes(32).toString('hex'), source: 'generated', persist: true };
  }

  return { token: crypto.randomBytes(32).toString('hex'), source: 'generated', persist: false };
}

function parseCommandLine(command) {
  const args = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) args.push(current);
  return args;
}

function browserLauncherForPlatform(url, {
  platform = process.platform,
  osRelease = os.release(),
  env = process.env
} = {}) {
  if (platform === 'darwin') return { bin: 'open', args: [url] };
  if (platform === 'win32') return { bin: 'rundll32.exe', args: ['url.dll,FileProtocolHandler', url] };
  if (platform === 'linux' && /microsoft/i.test(osRelease)) {
    return { bin: 'rundll32.exe', args: ['url.dll,FileProtocolHandler', url] };
  }
  if (platform === 'linux' && (env.DISPLAY || env.WAYLAND_DISPLAY)) {
    return { bin: 'xdg-open', args: [url] };
  }
  if (platform === 'linux') return null;
  return null;
}

function launcherFromEnv(url) {
  if (!process.env.BRAINSTORM_OPEN_CMD) return browserLauncherForPlatform(url);
  const parts = parseCommandLine(process.env.BRAINSTORM_OPEN_CMD);
  if (parts.length === 0) return null;
  return { bin: parts[0], args: parts.slice(1).concat(url) };
}

function formatUrlHost(host) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function companionUrl() {
  return `http://${formatUrlHost(URL_HOST)}:${actualPort}/?key=${encodeURIComponent(SESSION_TOKEN)}`;
}

function cookieName() {
  return `brainstorm-key-${actualPort}`;
}

function parseCookies(header) {
  const cookies = new Map();
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) continue;
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch (e) {
      cookies.set(name, value);
    }
  }

  return cookies;
}

function timingSafeEqualStr(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function requestUrl(req) {
  const host = req.headers.host || `${formatUrlHost(URL_HOST)}:${actualPort}`;
  return new URL(req.url, `http://${host}`);
}

function hasValidCookie(req) {
  const cookies = parseCookies(req.headers.cookie);
  const value = cookies.get(cookieName());
  return value !== undefined && timingSafeEqualStr(value, SESSION_TOKEN);
}

function authForRequest(req) {
  const url = requestUrl(req);
  const queryKey = url.searchParams.get('key');
  if (queryKey !== null) {
    return {
      authorized: timingSafeEqualStr(queryKey, SESSION_TOKEN),
      hasQueryKey: true,
      url
    };
  }

  return {
    authorized: hasValidCookie(req),
    hasQueryKey: false,
    url
  };
}

function securityHeaders(headers = {}) {
  return {
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'",
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...headers
  };
}

function sessionCookieHeader() {
  return `${cookieName()}=${encodeURIComponent(SESSION_TOKEN)}; HttpOnly; SameSite=Strict; Path=/`;
}

function authorizedHeaders(headers = {}) {
  return securityHeaders({
    'Set-Cookie': sessionCookieHeader(),
    ...headers
  });
}

function forbidden(res) {
  res.writeHead(403, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
  res.end('<!DOCTYPE html><html><body><h1>Forbidden</h1><p>The coding agent session key is required.</p></body></html>');
}

function notFound(res) {
  res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
  res.end('Not found');
}

function bootstrapPage() {
  const tokenJson = JSON.stringify(SESSION_TOKEN);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Brainstorm Companion</title></head>
<body><script>
try { sessionStorage.setItem('brainstorm-session-key', ${tokenJson}); }
catch (e) {}
location.replace('/');
</script></body></html>`;
}

// ========== HTTP Request Handler ==========

function handleRequest(req, res) {
  let auth;
  try {
    auth = authForRequest(req);
  } catch (e) {
    forbidden(res);
    return;
  }

  if (!auth.authorized) {
    forbidden(res);
    return;
  }

  touchActivity();
  if (req.method === 'GET' && auth.url.pathname === '/' && auth.hasQueryKey) {
    res.writeHead(200, authorizedHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
    res.end(bootstrapPage());
  } else if (req.method === 'GET' && auth.url.pathname === '/') {
    const screenFile = getNewestScreen();
    let html = screenFile
      ? (raw => isFullDocument(raw) ? raw : wrapInFrame(raw))(fs.readFileSync(screenFile, 'utf-8'))
      : WAITING_PAGE;

    if (html.includes('</body>')) {
      html = html.replace('</body>', helperInjection + '\n</body>');
    } else {
      html += helperInjection;
    }

    res.writeHead(200, authorizedHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
    res.end(html);
  } else if (req.method === 'GET' && auth.url.pathname.startsWith('/files/')) {
    const fileName = path.basename(auth.url.pathname.slice('/files/'.length));
    const filePath = path.join(CONTENT_DIR, fileName);
    if (
      !fileName ||
      fileName.startsWith('.') ||
      !fs.existsSync(filePath) ||
      !fs.statSync(filePath).isFile()
    ) {
      notFound(res);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, authorizedHeaders({ 'Content-Type': contentType }));
    res.end(fs.readFileSync(filePath));
  } else {
    notFound(res);
  }
}

// ========== WebSocket Connection Handling ==========

const clients = new Set();

function closeClient(socket, payload = Buffer.alloc(0)) {
  try { socket.end(encodeFrame(OPCODES.CLOSE, payload)); } catch (e) {}
  clients.delete(socket);
}

function normalizeOriginHost(host) {
  return String(host || '').replace(/^\[(.*)\]$/, '$1');
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' &&
      normalizeOriginHost(parsed.hostname) === normalizeOriginHost(URL_HOST) &&
      Number(parsed.port || 80) === actualPort;
  } catch (e) {
    return false;
  }
}

function rejectUpgrade(socket) {
  socket.write(
    'HTTP/1.1 403 Forbidden\r\n' +
    'Connection: close\r\n' +
    'Content-Type: text/plain; charset=utf-8\r\n\r\n' +
    'Forbidden'
  );
  socket.destroy();
}

function handleUpgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  let auth;
  try {
    auth = authForRequest(req);
  } catch (e) {
    rejectUpgrade(socket);
    return;
  }

  if (!key || !auth.authorized || !isSameOrigin(req)) {
    rejectUpgrade(socket);
    return;
  }

  const accept = computeAcceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  let buffer = Buffer.alloc(0);
  clients.add(socket);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      let result;
      try {
        result = decodeFrame(buffer);
      } catch (e) {
        closeClient(socket);
        return;
      }
      if (!result) break;
      buffer = buffer.slice(result.bytesConsumed);

      switch (result.opcode) {
        case OPCODES.TEXT:
          handleMessage(result.payload.toString());
          break;
        case OPCODES.CLOSE:
          closeClient(socket);
          return;
        case OPCODES.PING:
          socket.write(encodeFrame(OPCODES.PONG, result.payload));
          break;
        case OPCODES.PONG:
          break;
        default: {
          const closeBuf = Buffer.alloc(2);
          closeBuf.writeUInt16BE(1003);
          closeClient(socket, closeBuf);
          return;
        }
      }
    }
  });

  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
}

function handleMessage(text) {
  let event;
  try {
    event = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse WebSocket message:', e.message);
    return;
  }
  if (!event || typeof event !== 'object') return;
  touchActivity();
  console.log(JSON.stringify({ source: 'user-event', ...event }));
  if (event.choice) {
    const eventsFile = path.join(STATE_DIR, 'events');
    fs.appendFileSync(eventsFile, JSON.stringify(event) + '\n');
  }
}

function broadcast(msg) {
  const frame = encodeFrame(OPCODES.TEXT, Buffer.from(JSON.stringify(msg)));
  for (const socket of clients) {
    try { socket.write(frame); } catch (e) { clients.delete(socket); }
  }
}

// ========== Activity Tracking ==========

let lastActivity = Date.now();

function touchActivity() {
  lastActivity = Date.now();
}

// ========== File Watching ==========

const debounceTimers = new Map();

// ========== Server Startup ==========

function startServer() {
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

  const selectedPort = selectPort();
  let selectedToken = selectToken();
  SESSION_TOKEN = selectedToken.token;
  let allowPersistence = selectedPort.persist;
  let browserOpened = false;
  let attemptedFallback = false;

  // Track known files to distinguish new screens from updates.
  // macOS fs.watch reports 'rename' for both new files and overwrites,
  // so we can't rely on eventType alone.
  const knownFiles = new Set(
    fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.html'))
  );

  const server = http.createServer(handleRequest);
  server.on('upgrade', handleUpgrade);

  const watcher = fs.watch(CONTENT_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.html')) return;

    if (debounceTimers.has(filename)) clearTimeout(debounceTimers.get(filename));
    debounceTimers.set(filename, setTimeout(() => {
      debounceTimers.delete(filename);
      const filePath = path.join(CONTENT_DIR, filename);

      if (!fs.existsSync(filePath)) return; // file was deleted
      touchActivity();

      if (!knownFiles.has(filename)) {
        knownFiles.add(filename);
        const eventsFile = path.join(STATE_DIR, 'events');
        if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);
        console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      } else {
        console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
      }

      broadcast({ type: 'reload' });
      maybeOpenBrowser();
    }, 100));
  });
  watcher.on('error', (err) => console.error('fs.watch error:', err.message));

  function shutdown(reason, exitCode = 0) {
    console.log(JSON.stringify({ type: 'server-stopped', reason }));
    const infoFile = path.join(STATE_DIR, 'server-info');
    if (fs.existsSync(infoFile)) fs.unlinkSync(infoFile);
    fs.writeFileSync(
      path.join(STATE_DIR, 'server-stopped'),
      JSON.stringify({ reason, timestamp: Date.now() }) + '\n'
    );
    try { watcher.close(); } catch (e) {}
    clearInterval(lifecycleCheck);
    for (const socket of clients) {
      closeClient(socket);
      try { socket.destroy(); } catch (e) {}
    }
    server.close(() => process.exit(exitCode));
  }

  function ownerAlive() {
    if (!ownerPid) return true;
    try { process.kill(ownerPid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  }

  // Check periodically: exit if owner process died or idle past configured timeout.
  const lifecycleCheck = setInterval(() => {
    if (!ownerAlive()) shutdown('owner process exited');
    else if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) shutdown('idle timeout');
  }, LIFECYCLE_CHECK_MS);
  lifecycleCheck.unref();

  // Validate owner PID at startup. If it's already dead, the PID resolution
  // was wrong (common on WSL, Tailscale SSH, and cross-user scenarios).
  // Disable monitoring and rely on the idle timeout instead.
  if (ownerPid) {
    try { process.kill(ownerPid, 0); }
    catch (e) {
      if (e.code !== 'EPERM') {
        console.log(JSON.stringify({ type: 'owner-pid-invalid', pid: ownerPid, reason: 'dead at startup' }));
        ownerPid = null;
      }
    }
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  function isLoopbackHost(host) {
    return host === '127.0.0.1' || host === 'localhost';
  }

  function maybeOpenBrowser() {
    if (!process.env.BRAINSTORM_OPEN || browserOpened || !isLoopbackHost(HOST)) return;
    if (!getNewestScreen()) return;
    if (clients.size > 0) {
      browserOpened = true;
      return;
    }
    const launcher = launcherFromEnv(companionUrl());
    browserOpened = true;
    if (!launcher) return;
    const child = childProcess.execFile(launcher.bin, launcher.args, (error) => {
      if (error) console.error('browser open failed:', error.message);
    });
    if (child && typeof child.unref === 'function') child.unref();
  }

  function persistStartupState() {
    if (!allowPersistence) return;
    if (PORT_FILE) writeOwnerOnlyFile(PORT_FILE, `${actualPort}\n`);
    if (TOKEN_FILE && selectedToken.persist) writeOwnerOnlyFile(TOKEN_FILE, `${SESSION_TOKEN}\n`);
  }

  function startedInfo() {
    return JSON.stringify({
      type: 'server-started', port: actualPort, host: HOST,
      url_host: URL_HOST, url: companionUrl(),
      screen_dir: CONTENT_DIR, state_dir: STATE_DIR,
      idle_timeout_ms: IDLE_TIMEOUT_MS
    });
  }

  server.on('error', (err) => {
    if (err.code !== 'EADDRINUSE' || !selectedPort.preferred || attemptedFallback) {
      console.error(err.message);
      process.exit(1);
      return;
    }

    if (selectedToken.source === 'env') {
      console.error(`Preferred port ${selectedPort.port} is in use; refusing fallback while BRAINSTORM_TOKEN is set.`);
      process.exit(1);
      return;
    }

    if (selectedToken.source === 'file') {
      selectedToken = { token: crypto.randomBytes(32).toString('hex'), source: 'generated-fallback', persist: false };
      SESSION_TOKEN = selectedToken.token;
    }

    allowPersistence = false;
    attemptedFallback = true;
    server.listen(randomHighPort(), HOST);
  });

  server.listen(selectedPort.port, HOST, () => {
    actualPort = server.address().port;
    persistStartupState();
    const info = startedInfo();
    console.log(info);
    fs.writeFileSync(path.join(STATE_DIR, 'server-info'), info + '\n');
    maybeOpenBrowser();
  });

}

if (require.main === module) {
  startServer();
}

module.exports = { computeAcceptKey, encodeFrame, decodeFrame, OPCODES, MAX_FRAME_PAYLOAD_BYTES, browserLauncherForPlatform };

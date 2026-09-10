/**
 * BioGuardian Digital Twin - Backend Relay (Phase 03)
 * Provides:
 *  1. Embedded MQTT Broker (Aedes) listening on TCP port 1883.
 *  2. HTTP Static Web Server serving the 3D Dashboard on port 8080.
 *  3. WebSocket Server attached to port 8080 broadcasting telemetry to browser clients.
 */

const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const { Aedes } = require('aedes');

const MQTT_PORT = 1883;
const HTTP_PORT = 8080;
const TELEMETRY_TOPICS = new Set([
  'bioguardian/edge/telemetry',
  'bioguardian/twin/telemetry',
]);

async function startServer() {
  // 1. Initialize Embedded Aedes MQTT Broker
  const aedes = await Aedes.createBroker();
  const mqttServer = net.createServer(aedes.handle);

  mqttServer.listen(MQTT_PORT, '0.0.0.0', () => {
    console.log(`[MQTT Broker] Embedded Aedes MQTT broker listening on port ${MQTT_PORT}`);
  });

  mqttServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[MQTT Broker] Port ${MQTT_PORT} already in use. Assuming external broker is running.`);
    } else {
      console.error('[MQTT Broker Error]:', err);
    }
  });

  // 2. Initialize HTTP Server for Static Assets
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };

  const httpServer = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(__dirname, reqPath);

    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    });
  });

  // 3. Initialize WebSocket Server
  const wss = new WebSocketServer({ server: httpServer });
  let lastTelemetryFrame = null;

  function broadcastTelemetry(dataObj, rawString) {
    lastTelemetryFrame = dataObj;
    const msg = rawString || JSON.stringify(dataObj);

    let count = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
        count++;
      }
    });
    console.log(`[Relay] Dispatched frame to ${count} client(s)`);
  }

  wss.on('connection', (ws, req) => {
    const remoteIp = req.socket.remoteAddress;
    console.log(`[WebSocket] Client connected from ${remoteIp}`);

    ws.send(
      JSON.stringify({
        type: 'RELAY_CONNECTED',
        timestamp: new Date().toISOString(),
        activeTopic: 'bioguardian/edge/telemetry',
      })
    );

    if (lastTelemetryFrame) {
      ws.send(JSON.stringify(lastTelemetryFrame));
    }

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected (${remoteIp})`);
    });
  });

  // 4. Listen for published MQTT packets
  aedes.on('publish', (packet, client) => {
    if (!packet || !packet.topic) return;

    if (TELEMETRY_TOPICS.has(packet.topic)) {
      const rawPayload = packet.payload.toString('utf-8');
      try {
        const parsed = JSON.parse(rawPayload);
        console.log(`[MQTT Received] Topic: ${packet.topic} | Dev: ${parsed.device_id || 'Unknown'}`);
        broadcastTelemetry(parsed, rawPayload);
      } catch (e) {
        console.warn(`[MQTT] Non-JSON payload on ${packet.topic}`);
      }
    }
  });

  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`[Web & WS Server] BioGuardian Dashboard running at http://localhost:${HTTP_PORT}`);
    console.log(`[WebSocket] Relay endpoint live at ws://localhost:${HTTP_PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Error]:', err);
  process.exit(1);
});

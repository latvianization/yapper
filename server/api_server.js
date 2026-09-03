/**
 * Yapper Discord-Compatible CI/CD Webhook & Channel REST API Server
 * 
 * Implements Discord-compatible Webhook and Channel endpoints for CI/CD integrations
 * (GitHub Actions, GitLab CI, CircleCI, Jenkins, Sentry alerts, etc.)
 * 
 * Uses standard Node.js built-ins with zero external dependencies.
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// In-memory store (synchronized with Yapper channels)
const channels = [
  { id: 'announcements', name: 'announcements', category: 'ANNOUNCEMENTS', type: 5, topic: 'Company-wide news and critical updates' },
  { id: 'general', name: 'general', category: 'TEXT CHANNELS', type: 0, topic: 'Company updates, chatter, and discussion' },
  { id: 'engineering', name: 'engineering', category: 'TEXT CHANNELS', type: 0, topic: 'Code architecture, deploys, and bug reports' },
  { id: 'ci-builds', name: 'ci-builds', category: 'CI & ALERTS', type: 0, topic: 'Automated CI/CD deployment statuses & GitHub Actions' },
  { id: 'sentry-alerts', name: 'sentry-alerts', category: 'CI & ALERTS', type: 0, topic: 'Production error tracing and crash reports' },
  { id: 'random', name: 'random', category: 'TEXT CHANNELS', type: 0, topic: 'Memes and watercooler chat' },
  { id: 'voice-stage', name: 'voice-stage', category: 'VOICE & HUDDLES', type: 2, topic: 'Drop-in audio stage huddle' }
];

const webhooks = new Map();
// Pre-seed a default CI webhook for #ci-builds
webhooks.set('wh_ci_default', {
  id: 'wh_ci_default',
  name: 'GitHub Actions',
  channelId: 'ci-builds',
  token: 'ci_token_secret_12345',
  createdAt: new Date().toISOString()
});

const messages = [];

// SSE (Server-Sent Events) subscriber clients for live streaming to Flutter/Web
const sseClients = new Set();

function broadcastMessage(message) {
  messages.push(message);
  const dataString = `data: ${JSON.stringify(message)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;


  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. SSE Real-Time Event Stream
  if (pathname === '/api/v1/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  try {
    // 2. Discord-Compatible Webhook Execution: POST /api/webhooks/:channelId/:token
    const webhookMatch = pathname.match(/^\/api\/webhooks\/([^\/]+)\/([^\/]+)$/);
    if (webhookMatch && method === 'POST') {
      const [, channelId, token] = webhookMatch;
      const payload = await parseJsonBody(req);

      const targetChannel = channels.find(c => c.id === channelId) || { id: channelId, name: channelId };

      // Format message matching Discord webhook specification
      const message = {
        id: `msg_${crypto.randomUUID()}`,
        channelId: targetChannel.id,
        senderId: 'webhook_bot',
        senderName: payload.username || 'CI Bot',
        senderPhotoUrl: payload.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        isBot: true,
        text: payload.content || '',
        embeds: (payload.embeds || []).map(embed => ({
          title: embed.title || '',
          description: embed.description || '',
          url: embed.url || '',
          color: embed.color || 0x3B82F6, // e.g. 0x2ECC71 for green, 0xE74C3C for red
          author: embed.author ? {
            name: embed.author.name || '',
            iconUrl: embed.author.icon_url || '',
            url: embed.author.url || ''
          } : null,
          fields: (embed.fields || []).map(f => ({
            name: f.name || '',
            value: f.value || '',
            inline: f.inline === true
          })),
          footer: embed.footer ? {
            text: embed.footer.text || '',
            iconUrl: embed.footer.icon_url || ''
          } : null,
          timestamp: embed.timestamp || new Date().toISOString()
        })),
        createdAt: new Date().toISOString()
      };

      broadcastMessage(message);
      console.log(`[Webhook] Dispatched to #${targetChannel.name}: "${message.text || (message.embeds[0] && message.embeds[0].title)}"`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(message));
      return;
    }

    // 3. Discord-Compatible Bot Message API: POST /api/v1/channels/:channelId/messages
    const channelMsgMatch = pathname.match(/^\/api\/v1\/channels\/([^\/]+)\/messages$/);
    if (channelMsgMatch && method === 'POST') {
      const channelId = channelMsgMatch[1];
      const payload = await parseJsonBody(req);

      const message = {
        id: `msg_${crypto.randomUUID()}`,
        channelId: channelId,
        senderId: 'bot_api',
        senderName: payload.username || 'API Bot',
        senderPhotoUrl: payload.avatar_url || '',
        isBot: true,
        text: payload.content || '',
        embeds: payload.embeds || [],
        createdAt: new Date().toISOString()
      };

      broadcastMessage(message);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(message));
      return;
    }

    // 4. List Channel Messages: GET /api/v1/channels/:channelId/messages
    if (channelMsgMatch && method === 'GET') {
      const channelId = channelMsgMatch[1];
      const channelMsgs = messages.filter(m => m.channelId === channelId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(channelMsgs));
      return;
    }

    // 5. Discord-Compatible Guild Channels API: GET /api/v1/guilds/:guildId/channels or GET /api/v1/channels
    if ((pathname === '/api/v1/channels' || pathname.startsWith('/api/v1/guilds/')) && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(channels));
      return;
    }

    // 6. Create Webhook API: POST /api/v1/channels/:channelId/webhooks
    const createWhMatch = pathname.match(/^\/api\/v1\/channels\/([^\/]+)\/webhooks$/);
    if (createWhMatch && method === 'POST') {
      const channelId = createWhMatch[1];
      const payload = await parseJsonBody(req);
      const whId = `wh_${crypto.randomBytes(8).toString('hex')}`;
      const token = `tok_${crypto.randomBytes(16).toString('hex')}`;

      const webhook = {
        id: whId,
        channel_id: channelId,
        name: payload.name || 'CI Webhook',
        avatar: payload.avatar || null,
        token: token,
        url: `http://localhost:${PORT}/api/webhooks/${channelId}/${token}`
      };

      webhooks.set(whId, webhook);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(webhook));
      return;
    }

    // 7. Health Check
    if (pathname === '/health' || pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        service: 'Yapper Discord-Compatible CI/CD API',
        version: '1.0.0',
        channelsCount: channels.length,
        connectedSSEListeners: sseClients.size
      }));
      return;
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err) {
    console.error('[Server Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Yapper Discord CI/CD API listening on http://localhost:${PORT}`);
  console.log(`   Incoming Webhook URL format: http://localhost:${PORT}/api/webhooks/:channelId/:token`);
});

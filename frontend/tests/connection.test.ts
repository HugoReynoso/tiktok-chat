import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Server } from 'socket.io';
import { createLiveSocket } from '../src/services/connection.ts';

test('falls back to polling when WebSocket is unavailable', { timeout: 10000 }, async () => {
  const http = createServer();
  const server = new Server(http, { transports: ['polling'], allowUpgrades: false });
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  assert.ok(address && typeof address === 'object');
  const client = createLiveSocket(`http://127.0.0.1:${address.port}`);
  try {
    const connected = once(client, 'connect');
    client.connect();
    await connected;
    assert.equal(client.io.engine.transport.name, 'polling');
    assert.equal(client.io.opts.timeout, 60000);
  } finally { client.disconnect(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('reconnects after transport loss and manual disconnect cancels retries', { timeout: 15000 }, async () => {
  const http = createServer();
  const server = new Server(http);
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  assert.ok(address && typeof address === 'object');
  const client = createLiveSocket(`http://127.0.0.1:${address.port}`);
  let connectionCount = 0;
  server.on('connection', () => connectionCount++);
  try {
    const first = once(client, 'connect'); client.connect(); await first;
    const reconnected = once(client, 'connect');
    client.io.engine.close();
    await reconnected;
    assert.equal(connectionCount, 2);
    client.io.engine.close();
    client.disconnect();
    await new Promise(resolve => setTimeout(resolve, 3300));
    assert.equal(connectionCount, 2);
    assert.equal(client.active, false);
  } finally { client.disconnect(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

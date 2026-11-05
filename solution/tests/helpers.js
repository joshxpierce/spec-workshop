import http from 'node:http';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';
import { logger } from '../src/log.js';

// Starts the app on an ephemeral port with a fresh store.
// Returns { request, logs, close }.
export async function startTestServer() {
  const store = createStore();
  const logs = [];
  const originalWrite = logger.write;
  logger.write = (line) => logs.push(JSON.parse(line));

  const server = http.createServer(createApp({ store }));
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { body, token } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  async function close() {
    logger.write = originalWrite;
    await new Promise((resolve) => server.close(resolve));
  }

  return { request, logs, store, close };
}

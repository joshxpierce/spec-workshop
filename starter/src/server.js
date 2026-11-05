import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';
import { createStore } from './store.js';
import { log } from './log.js';

export function startServer({ port = Number(process.env.PORT ?? 3000), store = createStore() } = {}) {
  const server = http.createServer(createApp({ store }));
  server.listen(port, () => log('listening', { port: server.address().port }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}

/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { json } from '@sveltejs/kit';
import type { RouteHandler, RouteMatchCallback, WorkboxPlugin } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, type Route } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { NOTIFICATION_ACCEPT, NOTIFICATION_CLOSE } from './lib/configs/client';

interface RouteConfig {
  capture: string | RegExp | RouteMatchCallback | Route;
  handler: RouteHandler;
}

declare const self: ServiceWorkerGlobalScope;

const wbManifest = self.__WB_MANIFEST;

const networkTimeoutSeconds = 5;
const notificationsClicked: Set<string> = new Set();

setupCacheAndRoutes();
setupNotifications();
setupMessageListener();

function setupCacheAndRoutes(): void {
  if (wbManifest) {
    precacheAndRoute(wbManifest);
  }

  const routeConfig = generateRouteConfig();
  routeConfig.forEach(({ capture, handler }) => registerRoute(capture, handler));
}

function setupNotifications(): void {
  self.onnotificationclick = handleNotificationClick;
  self.onnotificationclose = handleNotificationClose;
}

function setupMessageListener(): void {
  self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}

function generateRouteConfig(): Array<RouteConfig> {
  return [
    {
      capture: /\/api\/trpc\/news\.search(\?.*)?$/,
      handler: new NetworkFirst({
        cacheName: 'api-news-search',
        plugins: [new ExpirationPlugin({ maxEntries: 64 }), fallbackResponsePlugin({ stories: [] })],
        networkTimeoutSeconds,
      }),
    },
    {
      capture: /\/api\/trpc\/news\.checkUpdates(\?.*)?$/,
      handler: new NetworkOnly({
        plugins: [fallbackResponsePlugin({ updateAvailable: false })],
        networkTimeoutSeconds,
      }),
    },
    {
      capture: /\/api\/trpc\/news\.content(\?.*)?$/,
      handler: new NetworkFirst({
        cacheName: 'api-news-content',
        plugins: [new ExpirationPlugin({ maxEntries: 256 })],
        networkTimeoutSeconds,
      }),
    },
  ];
}

function fallbackResponsePlugin<T>(data: T): WorkboxPlugin {
  return {
    handlerDidError: async () =>
      json({
        result: {
          data,
        },
      }),
  };
}

function getClients(): Promise<readonly Client[]> {
  return self.clients.matchAll();
}

async function focusClient(clients: readonly Client[], path?: string): Promise<void> {
  for (const client of clients) {
    const clientPath = new URL(client.url).pathname;
    if ('focus' in client && typeof client.focus === 'function' && (!path || clientPath === path)) {
      return client.focus();
    }
  }

  if ('openWindow' in clients && typeof clients.openWindow === 'function') {
    return clients.openWindow('/');
  }
}

async function notifyClientsAndFocus(id: string, type: string, path?: string): Promise<void> {
  const clients = await getClients();

  if (type !== NOTIFICATION_CLOSE) {
    await focusClient(clients, path);
  }

  clients?.forEach((client) => client.postMessage({ type, payload: { id } }));
}

async function handleNotificationClick(event: NotificationEvent): Promise<void> {
  const { id, path } = event.notification.data;
  const type = event.action || NOTIFICATION_ACCEPT;
  notificationsClicked.add(id);

  event.notification.close();
  event.waitUntil(notifyClientsAndFocus(id, type, path));
}

async function handleNotificationClose(event: NotificationEvent): Promise<void> {
  const id = event.notification.data.id;
  const type = NOTIFICATION_CLOSE;
  if (notificationsClicked.has(id)) {
    notificationsClicked.delete(id);
    return;
  }

  event.waitUntil(notifyClientsAndFocus(id, type));
}

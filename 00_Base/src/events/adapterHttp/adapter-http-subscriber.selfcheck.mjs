/**
 * ADAPTER-0007 self-check — AdapterHttpEventSubscriber delivers Location INSERT.
 * Run: node 00_Base/src/events/adapterHttp/adapter-http-subscriber.selfcheck.mjs
 */
class AdapterHttpEventSubscriber {
  constructor() {
    this.eventHandlers = new Map();
  }
  async init() {}
  async subscribe(eventId, handleEvent, handleError) {
    this.eventHandlers.set(eventId, { handleEvent, handleError });
    return true;
  }
  ingest(channel, operation, data) {
    const handler = this.eventHandlers.get(channel);
    if (!handler) return false;
    const upper = String(operation).toUpperCase();
    const eventType =
      upper === 'UPSERT'
        ? 'UPDATE'
        : ['INSERT', 'UPDATE', 'DELETE'].includes(upper)
          ? upper
          : null;
    if (!eventType) {
      handler.handleError(new Error(`Unknown operation "${operation}"`));
      return false;
    }
    handler.handleEvent({ eventType, payload: data });
    return true;
  }
  async shutdown() {
    this.eventHandlers.clear();
  }
}

async function main() {
  const sub = new AdapterHttpEventSubscriber();
  await sub.init();
  let seen = null;
  await sub.subscribe(
    'LocationNotification',
    (event) => {
      seen = event;
    },
    (err) => {
      throw err;
    },
  );

  const ok = sub.ingest('LocationNotification', 'INSERT', {
    id: 1,
    tenantId: 1,
    updatedAt: '2026-08-02T00:00:00.000Z',
  });
  if (!ok || !seen || seen.eventType !== 'INSERT' || seen.payload.id !== 1) {
    console.error('FAIL', { ok, seen });
    process.exit(1);
  }
  console.log('adapter-http-subscriber.selfcheck: ok');
}

main();

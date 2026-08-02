// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DtoEventType, IDtoEventSubscriber, IDtoPayload } from '../types';
import { ILogObj, Logger } from 'tslog';
import { Service } from 'typedi';

type EventHandler<T = any> = {
  handleEvent: (event: { eventType: DtoEventType; payload: T }) => void;
  handleError: (error: any) => void;
  handleDisconnect?: () => void;
};

/**
 * ADAPTER-0007 — replaces PgNotifyEventSubscriber. Adapter POSTs domain-change
 * envelopes; handlers registered by DtoRouter are invoked in-process.
 */
@Service()
export class AdapterHttpEventSubscriber implements IDtoEventSubscriber {
  protected readonly _logger: Logger<ILogObj>;
  protected eventHandlers = new Map<string, EventHandler>();
  protected subscribedChannels = new Set<string>();

  constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async init(): Promise<void> {
    this._logger.info('AdapterHttpEventSubscriber ready (no Postgres LISTEN)');
  }

  async subscribe<T extends IDtoPayload>(
    eventId: string,
    handleEvent: (event: { eventType: DtoEventType; payload: T }) => void,
    handleError: (error: any) => void,
    handleDisconnect?: () => void,
  ): Promise<boolean> {
    this.subscribedChannels.add(eventId);
    this.eventHandlers.set(eventId, {
      handleEvent,
      handleError,
      handleDisconnect,
    });
    this._logger.info(`Subscribed to adapter event channel "${eventId}"`);
    return true;
  }

  /**
   * Called by AdapterEventsController when the adapter relays a domain event.
   */
  ingest(channel: string, operation: string, data: unknown): boolean {
    const handler = this.eventHandlers.get(channel);
    if (!handler) {
      this._logger.warn(`No handler for adapter channel "${channel}"`);
      return false;
    }
    const eventType = normalizeOperation(operation);
    if (!eventType) {
      handler.handleError(new Error(`Unknown operation "${operation}"`));
      return false;
    }
    try {
      handler.handleEvent({ eventType, payload: data as IDtoPayload });
      return true;
    } catch (err) {
      this._logger.error(`Handler failed for "${channel}":`, err);
      handler.handleError(err);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    this.eventHandlers.clear();
    this.subscribedChannels.clear();
    this._logger.info('AdapterHttpEventSubscriber shut down');
  }
}

function normalizeOperation(operation: string): DtoEventType | undefined {
  const upper = operation.toUpperCase();
  if (upper === 'INSERT' || upper === 'UPDATE' || upper === 'DELETE') {
    return upper as DtoEventType;
  }
  if (upper === 'UPSERT') return DtoEventType.UPDATE;
  return undefined;
}

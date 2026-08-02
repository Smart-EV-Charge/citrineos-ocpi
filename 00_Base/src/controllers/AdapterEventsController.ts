// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, HeaderParam, JsonController, Post, UnauthorizedError } from 'routing-controllers';
import { Service } from 'typedi';
import { timingSafeEqual } from 'node:crypto';
import { AdapterHttpEventSubscriber } from '../events/adapterHttp/subscriber';

export const OCPI_DTO_CHANNELS = [
  'LocationNotification',
  'ChargingStationNotification',
  'EvseNotification',
  'ConnectorNotification',
  'TransactionNotification',
  'MeterValueNotification',
  'TariffNotification',
] as const;

export type OcpiDtoChannel = (typeof OCPI_DTO_CHANNELS)[number];

export interface AdapterDomainEventBody {
  channel: OcpiDtoChannel | string;
  operation: string;
  data: unknown;
}

/**
 * ADAPTER-0007 — adapter → OCPI domain-event ingest (service token, not OCPI partner auth).
 * Mounted under routePrefix `/ocpi` → `POST /ocpi/internal/v1/adapter/events`.
 */
@JsonController('/internal/v1/adapter')
@Service()
export class AdapterEventsController {
  constructor(private readonly subscriber: AdapterHttpEventSubscriber) {}

  @Post('/events')
  ingest(
    @Body() body: AdapterDomainEventBody,
    @HeaderParam('authorization') authorization?: string,
  ) {
    assertAdapterIngestToken(authorization);
    if (!body?.channel || !body?.operation) {
      return { accepted: false, reason: 'channel and operation are required' };
    }
    if (!OCPI_DTO_CHANNELS.includes(body.channel as OcpiDtoChannel)) {
      return { accepted: false, reason: `unknown channel "${body.channel}"` };
    }
    const ok = this.subscriber.ingest(body.channel, body.operation, body.data ?? {});
    return { accepted: ok };
  }
}

function assertAdapterIngestToken(authorization: string | undefined): void {
  const expected = process.env.ADAPTER_OCPI_INGEST_TOKEN ?? '';
  const supplied = bearerToken(authorization);
  if (!expected || expected.length < 32 || !supplied || !sameSecret(supplied, expected)) {
    throw new UnauthorizedError('Invalid adapter OCPI ingest credential');
  }
}

function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1];
}

function sameSecret(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

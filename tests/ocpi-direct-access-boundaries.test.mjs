/**
 * ADAPTER-0007 boundary gate — OCPI must not reintroduce CitrineOS Postgres bridge/LISTEN
 * or unfenced Hasura token mutation helpers under TARGET routing.
 *
 * Run: node --test tests/ocpi-direct-access-boundaries.test.mjs
 * (from citrineos-ocpi root)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

describe('ADAPTER-0007 OCPI direct-access boundaries', () => {
  it('sequelize.bridge.config.js is deleted', () => {
    assert.equal(
      exists('Server/src/config/sequelize.bridge.config.js'),
      false,
      'sequelize.bridge.config.js must remain deleted',
    );
  });

  it('PgNotifyEventSubscriber is deleted', () => {
    assert.equal(
      exists('00_Base/src/events/pgNotify/subscriber.ts'),
      false,
      'PgNotifyEventSubscriber must remain deleted',
    );
  });

  it('Dto router uses AdapterHttpEventSubscriber', () => {
    const src = read('03_Modules/DtoRouter/src/router/router.ts');
    assert.match(src, /AdapterHttpEventSubscriber/);
    assert.doesNotMatch(src, /PgNotifyEventSubscriber/);
  });

  it('docker compose does not inject DB_HOST for OCPI', () => {
    const yml = read('Server/docker-compose.yml');
    assert.doesNotMatch(yml, /^\s*DB_HOST:/m);
    assert.match(yml, /ADAPTER_OCPI_INGEST_TOKEN/);
    assert.match(yml, /EMSP_WRITE_ROUTING:\s*'TARGET'/);
  });

  it('TokensService keeps TARGET fence on write paths', () => {
    const src = read('00_Base/src/services/TokensService.ts');
    assert.match(src, /assertEmspLegacyTokenWriteAllowed/);
    const fence = read('00_Base/src/util/emsp-write-fence.ts');
    assert.match(fence, /EMSP_WRITE_ROUTING/);
    assert.match(fence, /TARGET/);
  });
});

/**
 * EMSP-0006 self-check for OCPI write fence (workspace has no jest/ts-jest).
 * Run: node 00_Base/src/util/emsp-write-fence.selfcheck.mjs
 */
function assertEmspLegacyTokenWriteAllowed(env = process.env) {
  const routing = (env.EMSP_WRITE_ROUTING ?? 'LEGACY').toUpperCase();
  if (routing === 'TARGET') {
    const error = new Error(
      'Canonical eMSP writer is selected; OCPI token writes are fenced (EMSP-0006)',
    );
    error.status = 503;
    throw error;
  }
}

function expectThrow(fn) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('expected throw');
}

delete process.env.EMSP_WRITE_ROUTING;
assertEmspLegacyTokenWriteAllowed();

process.env.EMSP_WRITE_ROUTING = 'LEGACY';
assertEmspLegacyTokenWriteAllowed();

process.env.EMSP_WRITE_ROUTING = 'TARGET';
expectThrow(() => assertEmspLegacyTokenWriteAllowed());

console.log('emsp-write-fence.selfcheck: ok');

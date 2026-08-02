/**
 * EMSP-0006/0009 — fence OCPI → Core/Hasura token mutations when eMSP owns token writes.
 * In-code default LEGACY (allow) for rollback. Deploy compose sets EMSP_WRITE_ROUTING=TARGET
 * (EMSP-0009); revert by unsetting or setting LEGACY.
 */
export function assertEmspLegacyTokenWriteAllowed(env: NodeJS.ProcessEnv = process.env): void {
  const routing = (env.EMSP_WRITE_ROUTING ?? 'LEGACY').toUpperCase();
  if (routing === 'TARGET') {
    const error = new Error(
      'Canonical eMSP writer is selected; OCPI token writes are fenced (EMSP-0006)',
    );
    (error as Error & { status: number }).status = 503;
    throw error;
  }
}

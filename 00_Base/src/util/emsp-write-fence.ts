/**
 * EMSP-0006 — fence OCPI → Core/Hasura token mutations when eMSP owns token writes.
 * Default LEGACY (allow). Never commit TARGET in shared env templates.
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

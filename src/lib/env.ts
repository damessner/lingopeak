/**
 * Centralized environment variable access.
 * All modules that need SESSION_SECRET import from here to avoid duplication.
 * Compatible with both Node.js and Edge (middleware) runtimes.
 */

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  // During build phase, generate a temporary secret so the build doesn't crash.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    if (!secret) {
      // Use globalThis.crypto for cross-runtime compatibility
      const arr = new Uint8Array(32);
      globalThis.crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  if (!secret || secret.length < 32) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: The SESSION_SECRET environment variable must be set and be at least 32 characters long.'
    );
  }

  return secret;
}

export const SESSION_SECRET = getSessionSecret();

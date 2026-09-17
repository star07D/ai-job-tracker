import { ConfigService } from '@nestjs/config';

// Vercel preview URLs for this project look like
// ai-job-tracker-frontend-<hash-or-branch>.vercel.app. Matching only this
// project's prefix (rather than any *.vercel.app, which anyone can deploy
// to for free) matters because CORS here runs with `credentials: true` —
// letting an arbitrary Vercel-hosted origin through would let it read the
// authenticated response of a credentialed cross-site request.
export const VERCEL_PREVIEW_PATTERN =
  /^https:\/\/ai-job-tracker-frontend-[a-z0-9-]+\.vercel\.app$/;

/**
 * Build the CORS origin check. `FRONTEND_URL` may be a single origin or a
 * comma-separated list. localhost:3000 is always allowed, and this
 * project's own Vercel preview deployments are allowed via the pattern
 * above.
 */
export function corsOrigin(config: ConfigService) {
  const configured = (config.get<string>('FRONTEND_URL') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allow = new Set([...configured, 'http://localhost:3000']);

  return (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allow.has(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
}

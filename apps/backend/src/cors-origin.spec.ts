import { corsOrigin } from './cors-origin';

function run(config: Record<string, string | undefined>, origin?: string) {
  const configService = { get: (key: string) => config[key] } as any;
  const check = corsOrigin(configService);
  return new Promise<boolean | undefined>((resolve) => {
    check(origin, (_err, allow) => resolve(allow));
  });
}

describe('corsOrigin', () => {
  const base = { FRONTEND_URL: 'https://rolio.example.com' };

  it('allows requests with no Origin header (e.g. server-to-server, curl)', async () => {
    expect(await run(base, undefined)).toBe(true);
  });

  it('allows the configured FRONTEND_URL', async () => {
    expect(await run(base, 'https://rolio.example.com')).toBe(true);
  });

  it('allows a comma-separated FRONTEND_URL list', async () => {
    const config = {
      FRONTEND_URL: 'https://a.example.com,https://b.example.com',
    };
    expect(await run(config, 'https://b.example.com')).toBe(true);
  });

  it('always allows localhost:3000', async () => {
    expect(await run(base, 'http://localhost:3000')).toBe(true);
  });

  it("allows this project's own Vercel preview deployments", async () => {
    expect(
      await run(
        base,
        'https://ai-job-tracker-frontend-git-main-star07d.vercel.app',
      ),
    ).toBe(true);
  });

  it('rejects an arbitrary *.vercel.app origin — the CORS-wildcard fix', async () => {
    expect(await run(base, 'https://evil-abc123.vercel.app')).toBe(false);
  });

  it('rejects an unrelated origin', async () => {
    expect(await run(base, 'https://attacker.example.com')).toBe(false);
  });

  it('rejects a look-alike origin that appends past .vercel.app', async () => {
    expect(
      await run(base, 'https://ai-job-tracker-frontend-x.vercel.app.evil.com'),
    ).toBe(false);
  });
});

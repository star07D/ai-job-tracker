// @nestjs/config@12 ships ESM-only; Jest's CJS transform can't parse its dist
// file directly. A minimal stub is all DI needs to wire the token by identity.
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import type { Profile } from 'passport-google-oauth20';

function profile(
  overrides: Partial<{ email: string; verified: boolean }> = {},
): Profile {
  const { email = 'a@example.com', verified = true } = overrides;
  return {
    id: 'g1',
    provider: 'google',
    displayName: 'A B',
    name: { givenName: 'A', familyName: 'B' },
    emails: [{ value: email, verified }],
  } as unknown as Profile;
}

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    const config = { get: jest.fn() } as unknown as ConfigService;
    strategy = new GoogleStrategy(config);
  });

  it('accepts a verified email and maps the profile', () => {
    const done = jest.fn();
    strategy.validate(
      'at',
      'rt',
      profile({ email: 'a@example.com', verified: true }),
      done,
    );

    expect(done).toHaveBeenCalledWith(null, {
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      googleId: 'g1',
    });
  });

  it('rejects an account with no email', () => {
    const done = jest.fn();
    const p = { id: 'g1', name: {}, emails: [] } as unknown as Profile;
    strategy.validate('at', 'rt', p, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error), false);
  });

  it('rejects an unverified email — auto-linking by email is only safe when Google has verified it', () => {
    const done = jest.fn();
    strategy.validate(
      'at',
      'rt',
      profile({ email: 'victim@example.com', verified: false }),
      done,
    );

    expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    const [err] = done.mock.calls[0];
    expect(err.message).toMatch(/not verified/i);
  });
});

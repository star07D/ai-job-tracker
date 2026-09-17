import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import type OAuth2Strategy from 'passport-oauth2';
import { StatelessOAuthStateStore } from './oauth-state.store';

export interface GoogleProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  googleId: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      // Falls back to placeholder values so the strategy can always be
      // constructed — GoogleAuthGuard blocks the route before this ever
      // runs when the real credentials aren't configured.
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:4000/auth/google/callback',
      scope: ['email', 'profile'],
      // Binds the callback to the browser that started the flow — see
      // StatelessOAuthStateStore for why (login CSRF otherwise).
      store: new StatelessOAuthStateStore(
        config.get<string>('NODE_ENV') === 'production',
      ) as unknown as OAuth2Strategy.StateStore,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const emailEntry = profile.emails?.[0];
    if (!emailEntry?.value) {
      return done(new Error('Google account has no email'), false);
    }
    // loginWithGoogle() auto-links to an existing password account by email
    // match — that's only safe because Google *verifies* the email it
    // hands back. An unverified email (Google does allow this in some
    // federated/Workspace setups) would let someone hijack an account they
    // don't own just by claiming its address, so it's rejected here rather
    // than trusted implicitly.
    if (!emailEntry.verified) {
      return done(new Error('Google account email is not verified'), false);
    }

    const result: GoogleProfile = {
      email: emailEntry.value,
      firstName: profile.name?.givenName ?? null,
      lastName: profile.name?.familyName ?? null,
      googleId: profile.id,
    };
    done(null, result);
  }
}

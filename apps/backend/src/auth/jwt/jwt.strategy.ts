import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  userId: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // JWT_SECRET presence is enforced at boot in main.ts
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      userId: payload.userId,
      email: payload.email,
    };
  }
}

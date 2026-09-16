import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { REFRESH_TOKEN_TTL_MS } from './auth.constants';
import { GoogleProfile } from './google/google.strategy';

export interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  /** Raw refresh token — the controller sets this as the httpOnly cookie and
   * never returns it in a JSON body. */
  refreshToken: string;
  user: PublicUser;
}

type UserRecord = PublicUser & { password: string | null };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let user: UserRecord;

    try {
      user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
        },
      });
    } catch (err) {
      // Unique-constraint violation — someone registered the same email between
      // the check above and this insert.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account signs in with Google');
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  /**
   * Finds or creates a user for a verified Google profile and issues a
   * token pair. Google only asserts *verified* emails, so it's safe to
   * auto-link an existing password account by email match.
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          googleId: profile.googleId,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId },
      });
    }

    return this.issueTokens(user);
  }

  /** Validates a refresh cookie, rotates it, and issues a fresh token pair. */
  async refresh(rawToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotation: this token is single-use. Revoking it here means a stolen,
    // already-used token can never be replayed.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(record.user);
  }

  /** Revokes a refresh token so it (and only it) can no longer be used. */
  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  // Refresh tokens are stored hashed — a database leak alone doesn't hand out
  // usable sessions.
  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}

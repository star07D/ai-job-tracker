import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './google/google-auth.guard';
import type { GoogleProfile } from './google/google.strategy';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants';

// Tighter rate limit on credential endpoints: 10 requests / minute / IP.
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.login(
      body.email,
      body.password,
    );
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.register(body);
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  // No JwtAuthGuard here — a session is renewed off the refresh cookie alone,
  // which is exactly what lets this run after the access token has expired.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE_NAME
    ];
    if (!token) {
      throw new UnauthorizedException('No refresh token');
    }

    const { refreshToken, ...result } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE_NAME
    ];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    return { success: true };
  }

  /** Lets the frontend know whether to show the "Continue with Google" button. */
  @Get('config')
  @HttpCode(HttpStatus.OK)
  getConfig() {
    return {
      googleEnabled: Boolean(
        this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      ),
    };
  }

  // Kicks off the Google OAuth handshake — GoogleAuthGuard redirects the
  // browser to Google's consent screen as a side effect of canActivate.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  google() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile | undefined;
    const frontendUrl = this.frontendUrl();

    if (!profile) {
      return res.redirect(`${frontendUrl}/login?error=google`);
    }

    try {
      const { refreshToken } = await this.authService.loginWithGoogle(profile);
      this.setRefreshCookie(res, refreshToken);
      res.redirect(`${frontendUrl}/dashboard`);
    } catch {
      res.redirect(`${frontendUrl}/login?error=google`);
    }
  }

  private frontendUrl(): string {
    return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000')
      .split(',')[0]
      .trim();
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      // Frontend and API are on different domains in production, so the
      // cookie needs SameSite=None there; localhost dev is same-site.
      sameSite: isProd ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }
}

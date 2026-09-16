import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvVars {
  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  @IsString()
  @MinLength(16, {
    message: 'JWT_SECRET must be at least 16 characters long',
  })
  JWT_SECRET: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  FRONTEND_URL?: string;

  @IsOptional()
  @IsInt()
  PORT?: number;

  // Governs the refresh-token cookie's Secure/SameSite flags — see
  // AuthController.setRefreshCookie. Render/Vercel set this in production.
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  // Optional — the AI interview-prep feature is disabled until this is set.
  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL?: string;

  // Optional — email digests are disabled until both of these are set.
  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  DIGEST_FROM_EMAIL?: string;

  // Shared secret the digest cron sends as the X-Digest-Secret header.
  @IsOptional()
  @IsString()
  DIGEST_SECRET?: string;

  // Optional — Google sign-in is disabled until both of these are set.
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  // Where Google redirects back after consent. Defaults to localhost for dev.
  @IsOptional()
  @IsUrl({ require_tld: false })
  GOOGLE_CALLBACK_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}

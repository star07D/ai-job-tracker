import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Build the CORS origin check. `FRONTEND_URL` may be a single origin or a
 * comma-separated list. localhost:3000 is always allowed, and any
 * `*.vercel.app` origin is allowed so Vercel preview deployments work.
 */
function corsOrigin(config: ConfigService) {
  const configured = (config.get<string>('FRONTEND_URL') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allow = new Set([...configured, 'http://localhost:3000']);

  return (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allow.has(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: corsOrigin(config),
    credentials: true,
  });

  await app.listen(config.get<number>('PORT') ?? 4000, '0.0.0.0');
}
void bootstrap();

import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (
      !this.config.get<string>('GOOGLE_CLIENT_ID') ||
      !this.config.get<string>('GOOGLE_CLIENT_SECRET')
    ) {
      throw new ServiceUnavailableException('Google sign-in is not set up');
    }
    return super.canActivate(context);
  }

  // Don't throw on a failed/denied Google login — the callback route
  // redirects to the frontend with an error instead of returning a raw
  // 401 to a browser that just came back from a full-page redirect.
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    return user;
  }
}

import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Exempt from rate limiting — the host pings this frequently.
  @SkipThrottle()
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}

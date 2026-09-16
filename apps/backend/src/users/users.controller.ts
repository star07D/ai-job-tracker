import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      req.user.userId,
      body.emailDigestEnabled,
    );
  }

  @Post('me/share')
  @HttpCode(HttpStatus.OK)
  enableSharing(@Req() req: AuthenticatedRequest) {
    return this.usersService.enableSharing(req.user.userId);
  }

  @Delete('me/share')
  @HttpCode(HttpStatus.OK)
  disableSharing(@Req() req: AuthenticatedRequest) {
    return this.usersService.disableSharing(req.user.userId);
  }
}

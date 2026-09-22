import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { UsersService } from './users.service';
import { ResumeParserService } from './resume-parser.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_MIME_PATTERN =
  /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly resumeParser: ResumeParserService,
  ) {}

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

  // Parsing a PDF/Word file is real CPU work — keep it well below the global limit.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('me/resume')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 1 },
    }),
  )
  async uploadResume(
    @Req() req: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: RESUME_MIME_PATTERN })
        .addMaxSizeValidator({ maxSize: MAX_RESUME_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ) {
    const text = await this.resumeParser.extractText(file);
    return this.usersService.uploadResume(
      req.user.userId,
      text,
      file.originalname,
    );
  }

  @Delete('me/resume')
  @HttpCode(HttpStatus.OK)
  removeResume(@Req() req: AuthenticatedRequest) {
    return this.usersService.removeResume(req.user.userId);
  }
}

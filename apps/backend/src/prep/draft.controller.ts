import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { DraftService } from './draft.service';
import { DRAFT_KINDS } from './prep.types';
import type { DraftKind } from './prep.types';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

class DraftDto {
  @IsIn(DRAFT_KINDS)
  kind: DraftKind;
}

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  // External LLM call — same low ceiling as prep and match.
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post(':id/draft')
  @HttpCode(HttpStatus.OK)
  generate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: DraftDto,
  ) {
    return this.draftService.generate(id, req.user.userId, body.kind);
  }
}

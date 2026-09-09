import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { ParseService } from './parse.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

class ParseJobDto {
  @IsString()
  @MinLength(20, { message: 'Paste a bit more of the job description.' })
  @MaxLength(20_000)
  description: string;
}

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  // External LLM call — hold it to the same low ceiling as prep generation.
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('parse')
  @HttpCode(HttpStatus.OK)
  parse(@Body() body: ParseJobDto) {
    return this.parseService.parse(body.description);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';

import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateJobDto) {
    return this.jobsService.create(req.user.userId, body);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.jobsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.jobsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateJobDto,
  ) {
    return this.jobsService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.jobsService.remove(id, req.user.userId);
  }
}

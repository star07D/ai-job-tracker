import { IsIn, IsOptional, IsString } from 'class-validator';
import { JOB_STATUSES } from '../job-status';
import type { JobStatus } from '../job-status';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

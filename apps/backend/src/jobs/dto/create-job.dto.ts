import {
  IsArray,
  IsEmail,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { JOB_STATUSES } from '../job-status';
import type { JobStatus } from '../job-status';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsIn(JOB_STATUSES)
  status: JobStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  appliedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nextAction?: string | null;

  @IsOptional()
  @IsISO8601()
  nextActionDue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  contactLinkedin?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}

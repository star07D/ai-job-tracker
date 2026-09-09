import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        status: data.status,
        location: data.location,
        salary: data.salary,
        notes: data.notes,
        appliedDate: data.appliedDate,
        // a backdated application has been sitting in its stage since then
        statusChangedAt: data.appliedDate,
        nextAction: data.nextAction,
        nextActionDue: data.nextActionDue,

        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.job.findMany({
      where: {
        userId,
      },
      orderBy: {
        appliedDate: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(id: string, userId: string, data: UpdateJobDto) {
    const existing = await this.findOne(id, userId);

    const statusChanged =
      data.status !== undefined && data.status !== existing.status;

    return this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        ...(statusChanged ? { statusChangedAt: new Date() } : {}),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.job.delete({
      where: { id },
    });
  }
}

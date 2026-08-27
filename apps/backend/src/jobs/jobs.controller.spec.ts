import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

const req = {
  user: { userId: 'u1', email: 'a@example.com' },
} as AuthenticatedRequest;

describe('JobsController', () => {
  let controller: JobsController;
  const jobsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: jobsService }],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('passes the authenticated userId into every service call', () => {
    const body = { title: 'Dev', company: 'Acme', status: 'Applied' as const };

    void controller.create(req, body);
    expect(jobsService.create).toHaveBeenCalledWith('u1', body);

    void controller.findAll(req);
    expect(jobsService.findAll).toHaveBeenCalledWith('u1');

    void controller.findOne('j1', req);
    expect(jobsService.findOne).toHaveBeenCalledWith('j1', 'u1');

    void controller.update('j1', req, { title: 'x' });
    expect(jobsService.update).toHaveBeenCalledWith('j1', 'u1', { title: 'x' });

    void controller.remove('j1', req);
    expect(jobsService.remove).toHaveBeenCalledWith('j1', 'u1');
  });
});

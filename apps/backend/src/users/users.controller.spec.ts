import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('GET /users/me looks up the authenticated user by id', async () => {
    usersService.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
    });

    const req = {
      user: { userId: 'u1', email: 'a@example.com' },
    } as AuthenticatedRequest;
    const result = await controller.getMe(req);

    expect(usersService.findById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: 'u1', email: 'a@example.com' });
  });
});

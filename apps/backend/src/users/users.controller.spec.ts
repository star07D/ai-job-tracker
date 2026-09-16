import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findById: jest.fn(),
    updatePreferences: jest.fn(),
    enableSharing: jest.fn(),
    disableSharing: jest.fn(),
  };

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

  it('PATCH /users/me forwards the flag to the service', async () => {
    usersService.updatePreferences.mockResolvedValue({
      id: 'u1',
      emailDigestEnabled: true,
    });

    const req = {
      user: { userId: 'u1', email: 'a@example.com' },
    } as AuthenticatedRequest;
    const result = await controller.updateMe(req, {
      emailDigestEnabled: true,
    });

    expect(usersService.updatePreferences).toHaveBeenCalledWith('u1', true);
    expect(result).toEqual({ id: 'u1', emailDigestEnabled: true });
  });

  it('POST /users/me/share turns sharing on for the authenticated user', async () => {
    usersService.enableSharing.mockResolvedValue({
      id: 'u1',
      shareToken: 'tok',
    });

    const req = {
      user: { userId: 'u1', email: 'a@example.com' },
    } as AuthenticatedRequest;
    const result = await controller.enableSharing(req);

    expect(usersService.enableSharing).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: 'u1', shareToken: 'tok' });
  });

  it('DELETE /users/me/share turns sharing off for the authenticated user', async () => {
    usersService.disableSharing.mockResolvedValue({
      id: 'u1',
      shareToken: null,
    });

    const req = {
      user: { userId: 'u1', email: 'a@example.com' },
    } as AuthenticatedRequest;
    const result = await controller.disableSharing(req);

    expect(usersService.disableSharing).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: 'u1', shareToken: null });
  });
});

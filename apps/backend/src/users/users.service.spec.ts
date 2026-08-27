import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, prismaMockProvider(prisma)],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('returns only public fields (never the password)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
        createdAt: new Date(),
      });

      const user = await service.findById('u1');

      const selectArg = prisma.user.findUnique.mock.calls[0][0].select;
      expect(selectArg).not.toHaveProperty('password');
      expect(Object.keys(selectArg).sort()).toEqual(
        ['createdAt', 'email', 'firstName', 'id', 'lastName'].sort(),
      );
      expect(user).not.toHaveProperty('password');
    });

    it('throws 404 when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

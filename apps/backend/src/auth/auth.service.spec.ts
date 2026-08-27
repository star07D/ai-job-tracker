import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  const jwt = { sign: jest.fn(() => 'test.jwt.token') };

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt.sign.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        prismaMockProvider(prisma),
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'supersecret',
      firstName: 'New',
      lastName: 'User',
    };

    it('hashes the password, persists the user and returns a signed token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      const result = await service.register(dto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          password: 'hashed-pw',
        }),
      });
      expect(result).toEqual({
        token: 'test.jwt.token',
        user: {
          id: 'u1',
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    });

    it('rejects a duplicate email with 409 (pre-check)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('translates a Prisma P2002 race into 409', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@example.com',
        password: 'hashed-pw',
        firstName: 'A',
        lastName: 'B',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('a@example.com', 'pw');

      expect(result.token).toBe('test.jwt.token');
      expect(result.user).toEqual({
        id: 'u1',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
      });
    });

    it('rejects an unknown email with 401', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('missing@example.com', 'pw'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password with 401', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@example.com',
        password: 'hashed-pw',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('a@example.com', 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});

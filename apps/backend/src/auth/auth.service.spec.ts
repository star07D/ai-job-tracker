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
const SHA256_HEX = /^[0-9a-f]{64}$/;

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

    it('hashes the password, persists the user and issues a token pair', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await service.register(dto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          password: 'hashed-pw',
        }),
      });
      expect(result.accessToken).toBe('test.jwt.token');
      expect(result.refreshToken).toMatch(/^[0-9a-f]{96}$/); // 48 random bytes, hex
      expect(result.user).toEqual({
        id: 'u1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      // the raw refresh token is never what gets persisted
      const createCall = prisma.refreshToken.create.mock.calls[0][0];
      expect(createCall.data.userId).toBe('u1');
      expect(createCall.data.tokenHash).toMatch(SHA256_HEX);
      expect(createCall.data.tokenHash).not.toBe(result.refreshToken);
      expect(createCall.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
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
    it('issues a token pair for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@example.com',
        password: 'hashed-pw',
        firstName: 'A',
        lastName: 'B',
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt1' });

      const result = await service.login('a@example.com', 'pw');

      expect(result.accessToken).toBe('test.jwt.token');
      expect(result.refreshToken).toEqual(expect.any(String));
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

  describe('refresh', () => {
    const user = {
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
    };

    it('rotates a valid token: revokes the old row and issues a new pair', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        tokenHash: 'irrelevant-in-the-mock',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86_400_000),
        user,
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt2' });

      const result = await service.refresh('some-raw-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.user).toEqual(user);
      expect(result.accessToken).toBe('test.jwt.token');
    });

    it('rejects an unknown token with 401', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('nope')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('rejects an already-revoked token with 401', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
        user,
      });
      await expect(service.refresh('used-already')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired token with 401', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user,
      });
      await expect(service.refresh('stale')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes only the matching, still-active token', async () => {
      await service.logout('some-raw-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.stringMatching(SHA256_HEX),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});

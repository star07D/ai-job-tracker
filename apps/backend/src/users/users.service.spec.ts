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
      expect(selectArg).not.toHaveProperty('resumeText');
      expect(Object.keys(selectArg).sort()).toEqual(
        [
          'createdAt',
          'email',
          'emailDigestEnabled',
          'firstName',
          'id',
          'lastName',
          'resumeFileName',
          'resumeUpdatedAt',
          'shareToken',
        ].sort(),
      );
      expect(user).not.toHaveProperty('password');
      expect(user.hasResume).toBe(false);
    });

    it('throws 404 when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updatePreferences', () => {
    it('updates the email digest flag and returns only public fields', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        email: 'a@example.com',
        emailDigestEnabled: true,
      });

      const user = await service.updatePreferences('u1', true);

      const call = prisma.user.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'u1' });
      expect(call.data).toEqual({ emailDigestEnabled: true });
      expect(call.select).not.toHaveProperty('password');
      expect(call.select).toHaveProperty('emailDigestEnabled', true);
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('uploadResume', () => {
    it('stores the extracted text, filename and timestamp, and reports hasResume', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        resumeFileName: 'cv.pdf',
        resumeUpdatedAt: new Date(),
      });

      const user = await service.uploadResume('u1', 'a whole résumé', 'cv.pdf');

      const call = prisma.user.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'u1' });
      expect(call.data).toEqual({
        resumeText: 'a whole résumé',
        resumeFileName: 'cv.pdf',
        resumeUpdatedAt: expect.any(Date),
      });
      expect(call.select).not.toHaveProperty('resumeText');
      expect(user.hasResume).toBe(true);
      expect(user).not.toHaveProperty('resumeText');
    });
  });

  describe('removeResume', () => {
    it('clears the résumé fields', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        resumeFileName: null,
        resumeUpdatedAt: null,
      });

      const user = await service.removeResume('u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { resumeText: null, resumeFileName: null, resumeUpdatedAt: null },
        select: expect.objectContaining({ resumeFileName: true }),
      });
      expect(user.hasResume).toBe(false);
    });
  });

  describe('enableSharing', () => {
    it('issues a fresh token and returns only public fields', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        shareToken: 'sometoken',
      });

      const user = await service.enableSharing('u1');

      const call = prisma.user.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'u1' });
      expect(call.data.shareToken).toMatch(/^[0-9a-f]{32}$/);
      expect(call.select).not.toHaveProperty('password');
      expect(user).toEqual({
        id: 'u1',
        shareToken: 'sometoken',
        hasResume: false,
      });
    });

    it('issues a different token each time (rotation)', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.enableSharing('u1');
      await service.enableSharing('u1');

      const [first, second] = prisma.user.update.mock.calls.map(
        (c) => c[0].data.shareToken,
      );
      expect(first).not.toBe(second);
    });
  });

  describe('disableSharing', () => {
    it('clears the share token', async () => {
      prisma.user.update.mockResolvedValue({ id: 'u1', shareToken: null });

      await service.disableSharing('u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { shareToken: null },
        select: expect.objectContaining({ shareToken: true }),
      });
    });
  });
});

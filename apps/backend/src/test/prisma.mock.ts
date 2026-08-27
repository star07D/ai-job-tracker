import { PrismaService } from '../prisma/prisma.service';

/**
 * Minimal in-memory-free mock of PrismaService for unit tests. Each model method
 * is a jest.fn() the test configures per-case.
 */
export type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  job: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

export function createPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

export const prismaMockProvider = (mock: PrismaMock) => ({
  provide: PrismaService,
  useValue: mock,
});

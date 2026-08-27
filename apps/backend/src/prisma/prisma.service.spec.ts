import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('is a PrismaClient with Nest lifecycle hooks', () => {
    const service = new PrismaService();
    expect(service).toBeInstanceOf(PrismaService);
    expect(typeof service.onModuleInit).toBe('function');
    expect(typeof service.onModuleDestroy).toBe('function');
  });
});

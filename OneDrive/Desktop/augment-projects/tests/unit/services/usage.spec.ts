import { beforeEach, describe, expect, it, vi } from 'vitest';
// Mock the Prisma client directly for testing purposes
const prisma = {
  usage: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

describe('UsageService', () => {
  let usageService: UsageService;

  beforeEach(() => {
  beforeEach(() => {
    usageService = new UsageService();
    // @ts-ignore: override the prisma instance in the service for testing
    usageService['prisma'] = prisma;
  });
  it('should track usage correctly under normal conditions', async () => {
    const userId = 'user123';
    const action = 'code_generation';

    const mockUsage = { userId, action, creditsUsed: 5 };
    (prisma.usage.findMany as unknown as import('vitest').MockInstance).mockResolvedValue([mockUsage]);
    (prisma.usage.create as unknown as import('vitest').MockInstance).mockResolvedValue(mockUsage);

    const result = await usageService.trackUsage(userId, action, 5);

    expect(prisma.usage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId, action, creditsUsed: 5 },
      })
    );
    expect(result).toHaveProperty('creditsUsed', 5);
  });

  it('should handle zero credits gracefully without error', async () => {
    const userId = 'user123';
    const action = 'view_dashboard';

    (prisma.usage.findMany as unknown as import('vitest').MockInstance).mockResolvedValue([]);
    (prisma.usage.create as unknown as import('vitest').MockInstance).mockResolvedValue({ userId, action, creditsUsed: 0 });

    const result = await usageService.trackUsage(userId, action, 0);

    expect(prisma.usage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId, action, creditsUsed: 0 },
      })
    );
    expect(result).toEqual({ creditsUsed: 0, message: 'No credits consumed' });
  });

  it('should return current usage summary for user with zero total credits used', async () => {
    const userId = 'user123';

    (prisma.usage.findMany as vi.Mock).mockResolvedValue([]);

    const result = await usageService.getUsageSummary(userId);

    expect(result.totalCreditsUsed).toBe(0);
    expect(result.actions).toEqual([]);
  });
});

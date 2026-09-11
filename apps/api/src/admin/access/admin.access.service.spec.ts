import { ForbiddenException } from '@nestjs/common';

import { PlatformRole, type DatabaseClient } from '@algoworld/database';

import { AdminAccessService } from './admin-access.service';

interface LocalUser {
  id: string;
  isActive: boolean;
  platformRole: PlatformRole;
}

describe('AdminAccessService', () => {
  const findUnique = jest.fn<Promise<LocalUser | null>, [args: unknown]>();
  const database = {
    user: { findUnique },
  } as unknown as DatabaseClient;
  const service = new AdminAccessService(database);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('allows an active local administrator matched by Clerk ID', async () => {
    findUnique.mockResolvedValue({
      id: 'local-admin-1',
      isActive: true,
      platformRole: PlatformRole.ADMIN,
    });

    await expect(service.requireAdmin('clerk-admin-1')).resolves.toEqual({
      userId: 'local-admin-1',
      platformRole: PlatformRole.ADMIN,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: 'clerk-admin-1' },
      select: { id: true, isActive: true, platformRole: true },
    });
  });

  it.each<{ label: string; user: LocalUser | null }>([
    { label: 'missing local user', user: null },
    {
      label: 'inactive administrator',
      user: {
        id: 'local-admin-1',
        isActive: false,
        platformRole: PlatformRole.ADMIN,
      },
    },
    {
      label: 'active ordinary user',
      user: {
        id: 'local-user-1',
        isActive: true,
        platformRole: PlatformRole.USER,
      },
    },
    {
      label: 'inactive ordinary user',
      user: {
        id: 'local-user-1',
        isActive: false,
        platformRole: PlatformRole.USER,
      },
    },
  ])('rejects a $label', async ({ user }) => {
    findUnique.mockResolvedValue(user);

    await expect(service.requireAdmin('clerk-user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('checks the database again after an administrator is demoted', async () => {
    findUnique
      .mockResolvedValueOnce({
        id: 'local-admin-1',
        isActive: true,
        platformRole: PlatformRole.ADMIN,
      })
      .mockResolvedValueOnce({
        id: 'local-admin-1',
        isActive: true,
        platformRole: PlatformRole.USER,
      });

    await expect(service.requireAdmin('clerk-admin-1')).resolves.toEqual({
      userId: 'local-admin-1',
      platformRole: PlatformRole.ADMIN,
    });
    await expect(service.requireAdmin('clerk-admin-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});

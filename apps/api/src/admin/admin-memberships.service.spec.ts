import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ClientRole, Prisma, type DatabaseClient } from '@algoworld/database';

import type { AdminAccessService } from './admin-access.service';
import { AdminMembershipsService } from './admin-memberships.service';
import type {
  AdminClientMembership,
  AdminMembershipUser,
} from './admin-memberships.types';
import type { AdminSession } from './admin.types';

describe('AdminMembershipsService', () => {
  const requireAdmin = jest.fn<Promise<AdminSession>, [clerkUserId: string]>();
  const findUnique = jest.fn<Promise<{ id: string } | null>, [args: unknown]>();
  const findMany = jest.fn<Promise<AdminClientMembership[]>, [args: unknown]>();
  const findUsers = jest.fn<Promise<AdminMembershipUser[]>, [args: unknown]>();
  const findUser = jest.fn<
    Promise<{ id: string; isActive: boolean } | null>,
    [args: unknown]
  >();
  const createMembership = jest.fn<
    Promise<AdminClientMembership>,
    [args: unknown]
  >();

  const updateMembership = jest.fn<
    Promise<AdminClientMembership>,
    [args: unknown]
  >();
  const deleteMembership = jest.fn<
    Promise<{ clientId: string; userId: string }>,
    [args: unknown]
  >();

  const database = {
    client: { findUnique },
    clientMembership: {
      findMany,
      create: createMembership,
      update: updateMembership,
      delete: deleteMembership,
    },
    user: { findMany: findUsers, findUnique: findUser },
  } as unknown as DatabaseClient;
  const adminAccessService = { requireAdmin } as unknown as AdminAccessService;
  const service = new AdminMembershipsService(database, adminAccessService);

  const activeUser: AdminMembershipUser = {
    id: 'local-user-1',
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: null,
    isActive: true,
  };
  const createdMembership: AdminClientMembership = {
    clientId: 'client-1',
    userId: activeUser.id,
    role: ClientRole.MEMBER,
    user: activeUser,
    createdAt: new Date('2026-09-10T12:00:00.000Z'),
    updatedAt: new Date('2026-09-10T12:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdmin.mockResolvedValue({
      userId: 'local-admin-1',
      platformRole: 'ADMIN',
    });
    findUnique.mockResolvedValue({ id: 'client-1' });
    findMany.mockResolvedValue([]);
    findUsers.mockResolvedValue([]);
    findUser.mockResolvedValue({ id: activeUser.id, isActive: true });
    createMembership.mockResolvedValue(createdMembership);
    updateMembership.mockResolvedValue(createdMembership);
    deleteMembership.mockResolvedValue({
      clientId: 'client-1',
      userId: activeUser.id,
    });
  });

  it('returns memberships including inactive users and scopes the query to the client', async () => {
    const memberships: AdminClientMembership[] = [
      {
        clientId: 'client-1',
        userId: 'local-user-1',
        role: ClientRole.OWNER,
        user: {
          id: 'local-user-1',
          email: 'owner@example.com',
          firstName: 'Alex',
          lastName: null,
          isActive: true,
        },
        createdAt: new Date('2026-09-01T12:00:00.000Z'),
        updatedAt: new Date('2026-09-01T12:00:00.000Z'),
      },
      {
        clientId: 'client-1',
        userId: 'local-user-2',
        role: ClientRole.MEMBER,
        user: {
          id: 'local-user-2',
          email: 'member@example.com',
          firstName: null,
          lastName: null,
          isActive: false,
        },
        createdAt: new Date('2026-09-02T12:00:00.000Z'),
        updatedAt: new Date('2026-09-02T12:00:00.000Z'),
      },
    ];
    findMany.mockResolvedValue(memberships);

    await expect(
      service.findForClient('clerk-admin-1', 'client-1'),
    ).resolves.toEqual(memberships);

    expect(requireAdmin).toHaveBeenCalledWith('clerk-admin-1');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      select: { id: true },
    });
    // Query-contract check: the mock does not execute filtering or sorting.
    expect(findMany).toHaveBeenCalledWith({
      where: { clientId: 'client-1' },
      select: {
        clientId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
    });
  });

  it('returns an empty list for an existing client without memberships', async () => {
    await expect(
      service.findForClient('clerk-admin-1', 'client-1'),
    ).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('does not query client data when administrator access is denied', async () => {
    const error = new ForbiddenException('Administrator access is required.');
    requireAdmin.mockRejectedValue(error);

    await expect(
      service.findForClient('clerk-user-1', 'client-1'),
    ).rejects.toBe(error);

    expect(requireAdmin).toHaveBeenCalledWith('clerk-user-1');
    expect(findUnique).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns 404 without querying memberships when the client is missing', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.findForClient('clerk-admin-1', 'missing-client'),
    ).rejects.toThrow(NotFoundException);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'missing-client' },
      select: { id: true },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('propagates a failed client lookup instead of reporting an empty list', async () => {
    const error = new Error('Database unavailable');
    findUnique.mockRejectedValue(error);

    await expect(
      service.findForClient('clerk-admin-1', 'client-1'),
    ).rejects.toBe(error);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('propagates a failed membership query instead of reporting an empty list', async () => {
    const error = new Error('Membership query failed');
    findMany.mockRejectedValue(error);

    await expect(
      service.findForClient('clerk-admin-1', 'client-1'),
    ).rejects.toBe(error);
  });

  describe.each([
    {
      label: 'membership role update',
      run: () =>
        service.updateForClient('clerk-admin-1', 'client-1', activeUser.id, {
          role: 'OWNER',
        }),
    },
    {
      label: 'membership removal',
      run: () =>
        service.removeForClient('clerk-admin-1', 'client-1', activeUser.id),
    },
    {
      label: 'user search',
      run: () =>
        service.findAvailableUsersForClient(
          'clerk-admin-1',
          'client-1',
          'alex',
        ),
    },
    {
      label: 'membership creation',
      run: () =>
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
    },
  ])('$label authorization', ({ run }) => {
    it('stops before data queries when administrator access is denied', async () => {
      const error = new ForbiddenException('Administrator access is required.');
      requireAdmin.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);
      expect(requireAdmin).toHaveBeenCalledWith('clerk-admin-1');
      expect(findUnique).not.toHaveBeenCalled();
      expect(findUsers).not.toHaveBeenCalled();
      expect(findUser).not.toHaveBeenCalled();
      expect(createMembership).not.toHaveBeenCalled();
      expect(updateMembership).not.toHaveBeenCalled();
      expect(deleteMembership).not.toHaveBeenCalled();
    });

    it('stops before user queries or writes when the client is missing', async () => {
      findUnique.mockResolvedValue(null);

      await expect(run()).rejects.toThrow(NotFoundException);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        select: { id: true },
      });
      expect(findUsers).not.toHaveBeenCalled();
      expect(findUser).not.toHaveBeenCalled();
      expect(createMembership).not.toHaveBeenCalled();
      expect(updateMembership).not.toHaveBeenCalled();
      expect(deleteMembership).not.toHaveBeenCalled();
    });
  });

  describe('membership role updates', () => {
    it.each([ClientRole.OWNER, ClientRole.MANAGER, ClientRole.MEMBER])(
      'updates only the selected client/user membership to %s',
      async (role) => {
        updateMembership.mockResolvedValue({ ...createdMembership, role });
        await expect(
          service.updateForClient('clerk-admin-1', 'client-1', activeUser.id, {
            role,
          }),
        ).resolves.toEqual({ ...createdMembership, role });
        expect(updateMembership).toHaveBeenCalledWith({
          where: {
            clientId_userId: { clientId: 'client-1', userId: activeUser.id },
          },
          data: { role },
          select: {
            clientId: true,
            userId: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
              },
            },
          },
        });
        expect(createMembership).not.toHaveBeenCalled();
        expect(deleteMembership).not.toHaveBeenCalled();
      },
    );

    it.each<{ label: string; input: unknown }>([
      { label: 'missing role', input: {} },
      { label: 'platform role', input: { role: 'ADMIN' } },
      {
        label: 'changed client',
        input: { role: 'MEMBER', clientId: 'other-client' },
      },
      {
        label: 'changed user',
        input: { role: 'MEMBER', userId: 'other-user' },
      },
      { label: 'null input', input: null },
    ])('rejects $label without writing', async ({ input }) => {
      await expect(
        service.updateForClient(
          'clerk-admin-1',
          'client-1',
          activeUser.id,
          input,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(updateMembership).not.toHaveBeenCalled();
    });

    it('allows maintaining an existing inactive user membership without activating the user', async () => {
      const membership = {
        ...createdMembership,
        user: { ...activeUser, isActive: false },
      };
      updateMembership.mockResolvedValue(membership);
      await expect(
        service.updateForClient('clerk-admin-1', 'client-1', activeUser.id, {
          role: 'MEMBER',
        }),
      ).resolves.toEqual(membership);
      expect(findUser).not.toHaveBeenCalled();
    });
  });

  describe('membership removal', () => {
    it('deletes only the membership identified by both client and user', async () => {
      await expect(
        service.removeForClient('clerk-admin-1', 'client-1', activeUser.id),
      ).resolves.toBeUndefined();
      expect(deleteMembership).toHaveBeenCalledWith({
        where: {
          clientId_userId: { clientId: 'client-1', userId: activeUser.id },
        },
        select: { clientId: true, userId: true },
      });
      expect(updateMembership).not.toHaveBeenCalled();
      expect(createMembership).not.toHaveBeenCalled();
    });
  });

  describe.each([
    {
      label: 'update',
      run: () =>
        service.updateForClient('clerk-admin-1', 'client-1', activeUser.id, {
          role: 'MEMBER',
        }),
      fail: (error: Error) => {
        updateMembership.mockRejectedValue(error);
      },
    },
    {
      label: 'removal',
      run: () =>
        service.removeForClient('clerk-admin-1', 'client-1', activeUser.id),
      fail: (error: Error) => {
        deleteMembership.mockRejectedValue(error);
      },
    },
  ])('$label failures', ({ run, fail }) => {
    it('returns 404 if no membership matches the client/user key', async () => {
      fail(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );
      await expect(run()).rejects.toThrow(NotFoundException);
    });

    it('preserves unexpected database errors', async () => {
      const error = new Error('Database unavailable');
      fail(error);
      await expect(run()).rejects.toBe(error);
    });
  });

  describe('available-user search', () => {
    it('requests active matching users without a membership in this client', async () => {
      findUsers.mockResolvedValue([activeUser]);

      await expect(
        service.findAvailableUsersForClient(
          'clerk-admin-1',
          'client-1',
          '  alex  ',
        ),
      ).resolves.toEqual([activeUser]);

      // This verifies query instructions, not database filtering itself.
      expect(findUsers).toHaveBeenCalledWith({
        where: {
          isActive: true,
          memberships: { none: { clientId: 'client-1' } },
          OR: [
            { email: { contains: 'alex', mode: 'insensitive' } },
            { firstName: { contains: 'alex', mode: 'insensitive' } },
            { lastName: { contains: 'alex', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
        orderBy: [{ email: 'asc' }, { id: 'asc' }],
        take: 20,
      });
    });

    it.each([undefined, '', 'a', '  '])(
      'skips user lookup for a short search: %s',
      async (query) => {
        await expect(
          service.findAvailableUsersForClient(
            'clerk-admin-1',
            'client-1',
            query,
          ),
        ).resolves.toEqual([]);
        expect(findUsers).not.toHaveBeenCalled();
      },
    );

    it.each<{ label: string; query: unknown }>([
      { label: 'repeated query parameters', query: ['alex', 'sam'] },
      { label: 'an object', query: { name: 'alex' } },
      { label: 'an overly long query', query: 'a'.repeat(101) },
    ])('rejects $label before searching', async ({ query }) => {
      await expect(
        service.findAvailableUsersForClient('clerk-admin-1', 'client-1', query),
      ).rejects.toThrow(BadRequestException);
      expect(findUsers).not.toHaveBeenCalled();
    });
  });

  describe('membership creation', () => {
    it('checks the selected local user and creates a MEMBER by default', async () => {
      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: '  local-user-1  ',
        }),
      ).resolves.toEqual(createdMembership);

      expect(requireAdmin).toHaveBeenCalledWith('clerk-admin-1');
      expect(findUser).toHaveBeenCalledWith({
        where: { id: 'local-user-1' },
        select: { id: true, isActive: true },
      });
      expect(createMembership).toHaveBeenCalledTimes(1);
      expect(createMembership.mock.calls[0]?.[0]).toMatchObject({
        data: {
          clientId: 'client-1',
          userId: 'local-user-1',
          role: ClientRole.MEMBER,
        },
      });
    });

    it.each([ClientRole.OWNER, ClientRole.MANAGER])(
      'accepts the explicitly selected role %s',
      async (role) => {
        createMembership.mockResolvedValue({ ...createdMembership, role });

        await expect(
          service.createForClient('clerk-admin-1', 'client-1', {
            userId: activeUser.id,
            role,
          }),
        ).resolves.toEqual({ ...createdMembership, role });
        expect(createMembership.mock.calls[0]?.[0]).toMatchObject({
          data: { clientId: 'client-1', userId: activeUser.id, role },
        });
      },
    );

    it.each<{ label: string; input: unknown }>([
      { label: 'missing user ID', input: {} },
      { label: 'blank user ID', input: { userId: ' ' } },
      {
        label: 'invalid role',
        input: { userId: 'local-user-1', role: 'ADMIN' },
      },
      {
        label: 'extra client ID',
        input: { userId: 'local-user-1', clientId: 'other-client' },
      },
      { label: 'non-object input', input: null },
    ])(
      'rejects $label before looking up the user or writing',
      async ({ input }) => {
        await expect(
          service.createForClient('clerk-admin-1', 'client-1', input),
        ).rejects.toThrow(BadRequestException);
        expect(findUser).not.toHaveBeenCalled();
        expect(createMembership).not.toHaveBeenCalled();
      },
    );

    it('returns 404 when the selected user no longer exists', async () => {
      findUser.mockResolvedValue(null);

      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(createMembership).not.toHaveBeenCalled();
    });

    it('rejects a user who became inactive after appearing in search results', async () => {
      findUser.mockResolvedValue({ id: activeUser.id, isActive: false });

      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(createMembership).not.toHaveBeenCalled();
    });

    it('returns 409 when the compound membership key already exists', async () => {
      createMembership.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
      ).rejects.toThrow(ConflictException);
      expect(createMembership).toHaveBeenCalledTimes(1);
    });

    it('returns 404 if the client or user disappears before insertion', async () => {
      createMembership.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          { code: 'P2003', clientVersion: 'test' },
        ),
      );

      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database failures', async () => {
      const error = new Error('Database unavailable');
      createMembership.mockRejectedValue(error);

      await expect(
        service.createForClient('clerk-admin-1', 'client-1', {
          userId: activeUser.id,
        }),
      ).rejects.toBe(error);
    });
  });
});

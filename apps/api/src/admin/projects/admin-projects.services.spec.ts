import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  type DatabaseClient,
} from '@algoworld/database';

import type { AdminAccessService } from '../access/admin-access.service';
import type { AdminSession } from '../admin.types';
import { AdminProjectsService } from './admin-projects.service';
import type { AdminProject } from './admin-projects.types';

describe('AdminProjectsService', () => {
  const requireAdmin = jest.fn<Promise<AdminSession>, [clerkUserId: string]>();
  const findClient = jest.fn<Promise<{ id: string } | null>, [args: unknown]>();
  const findMany = jest.fn<Promise<AdminProject[]>, [args: unknown]>();
  const findFirst = jest.fn<Promise<AdminProject | null>, [args: unknown]>();
  const create = jest.fn<Promise<AdminProject>, [args: unknown]>();
  const update = jest.fn<Promise<AdminProject>, [args: unknown]>();
  const database = {
    client: { findUnique: findClient },
    project: { findMany, findFirst, create, update },
  } as unknown as DatabaseClient;
  const access = { requireAdmin } as unknown as AdminAccessService;
  const service = new AdminProjectsService(database, access);
  const select = {
    id: true,
    clientId: true,
    name: true,
    description: true,
    status: true,
    startDate: true,
    targetEndDate: true,
    completedAt: true,
    isVisibleToClient: true,
    createdAt: true,
    updatedAt: true,
  };
  const project: AdminProject = {
    id: 'project-1',
    clientId: 'client-1',
    name: 'Website',
    description: null,
    status: ProjectStatus.PLANNING,
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    isVisibleToClient: false,
    createdAt: new Date('2026-09-10T12:00:00Z'),
    updatedAt: new Date('2026-09-10T12:00:00Z'),
  };
  const input = {
    name: 'Website',
    description: null,
    status: ProjectStatus.PLANNING,
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    isVisibleToClient: false,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdmin.mockResolvedValue({
      userId: 'admin-1',
      platformRole: 'ADMIN',
    });
    findClient.mockResolvedValue({ id: 'client-1' });
    findMany.mockResolvedValue([project]);
    findFirst.mockResolvedValue(project);
    create.mockResolvedValue(project);
    update.mockResolvedValue(project);
  });

  describe.each([
    {
      label: 'list',
      run: () => service.findForClient('clerk-admin', 'client-1'),
    },
    {
      label: 'detail',
      run: () => service.findOne('clerk-admin', 'client-1', 'project-1'),
    },
    {
      label: 'create',
      run: () => service.create('clerk-admin', 'client-1', input),
    },
    {
      label: 'update',
      run: () => service.update('clerk-admin', 'client-1', 'project-1', input),
    },
  ])('$label authorization', ({ run }) => {
    it('stops before database access when ADMIN access is denied', async () => {
      const error = new ForbiddenException();
      requireAdmin.mockRejectedValue(error);
      await expect(run()).rejects.toBe(error);
      expect(requireAdmin).toHaveBeenCalledWith('clerk-admin');
      expect(findClient).not.toHaveBeenCalled();
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
    it('returns 404 without project queries for a missing client', async () => {
      findClient.mockResolvedValue(null);
      await expect(run()).rejects.toThrow(NotFoundException);
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });

  it('requests all projects for exactly this client, including hidden records', async () => {
    const visible = { ...project, id: 'project-2', isVisibleToClient: true };
    findMany.mockResolvedValue([project, visible]);
    await expect(
      service.findForClient('clerk-admin', 'client-1'),
    ).resolves.toEqual([project, visible]);
    // Verify the query scope; these mocks do not execute database filtering.
    expect(findMany).toHaveBeenCalledWith({
      where: { clientId: 'client-1' },
      select,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  });

  it('scopes project detail to both project ID and client ID', async () => {
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-1'),
    ).resolves.toEqual(project);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'project-1', clientId: 'client-1' },
      select,
    });
  });

  it('returns 404 for a missing or mismatched project detail', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-2'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a hidden project and takes its client ID from the route', async () => {
    await service.create('clerk-admin', 'client-1', { name: '  Website  ' });
    expect(create).toHaveBeenCalledWith({
      data: { ...input, clientId: 'client-1' },
      select,
    });
  });

  it('converts valid calendar dates to UTC midnight on creation', async () => {
    await service.create('clerk-admin', 'client-1', {
      ...input,
      startDate: '2026-09-10',
      targetEndDate: '2026-09-11',
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        clientId: 'client-1',
        startDate: new Date('2026-09-10T00:00:00.000Z'),
        targetEndDate: new Date('2026-09-11T00:00:00.000Z'),
      },
      select,
    });
  });

  it('includes the client in the update itself and allows clearing dates', async () => {
    await service.update('clerk-admin', 'client-1', 'project-1', {
      ...input,
      isVisibleToClient: true,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'project-1', clientId: 'client-1' },
      data: { ...input, isVisibleToClient: true },
      select,
    });
  });

  it.each([
    {
      label: 'invalid create',
      run: () =>
        service.create('clerk-admin', 'client-1', {
          ...input,
          isVisibleToClient: 'true',
        }),
    },
    {
      label: 'invalid update',
      run: () =>
        service.update('clerk-admin', 'client-1', 'project-1', {
          ...input,
          targetEndDate: '2026-02-30',
        }),
    },
    {
      label: 'client reassignment',
      run: () =>
        service.update('clerk-admin', 'client-1', 'project-1', {
          ...input,
          clientId: 'other-client',
        }),
    },
  ])('rejects $label without writing', async ({ run }) => {
    await expect(run()).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 404 when an update matches no project under this client', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update('clerk-admin', 'client-1', 'project-2', input),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 404 if the client is deleted before creation', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key failed', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create('clerk-admin', 'client-1', input),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not disguise an unexpected write failure as a successful save', async () => {
    const error = new Error('Database unavailable');
    update.mockRejectedValue(error);
    await expect(
      service.update('clerk-admin', 'client-1', 'project-1', input),
    ).rejects.toBe(error);
  });
});

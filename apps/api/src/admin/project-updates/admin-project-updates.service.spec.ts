import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type DatabaseClient } from '@algoworld/database';
import type { AdminAccessService } from '../access/admin-access.service';
import { AdminProjectUpdatesService } from './admin-project-updates.service';

const select = {
  id: true,
  projectId: true,
  authorUserId: true,
  author: { select: { id: true, firstName: true, lastName: true } },
  title: true,
  content: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectUpdateSelect;
type UpdateRecord = Prisma.ProjectUpdateGetPayload<{ select: typeof select }>;
const input = {
  title: 'Design approved',
  content: 'Development starts next week.',
};
const record: UpdateRecord = {
  ...input,
  id: 'update-1',
  projectId: 'project-1',
  authorUserId: 'admin-1',
  author: { id: 'admin-1', firstName: 'Peter', lastName: null },
  publishedAt: null,
  createdAt: new Date('2026-09-11T10:15:30.123Z'),
  updatedAt: new Date('2026-09-11T10:15:30.123Z'),
};
const serialized = {
  ...record,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
};
const now = new Date('2026-09-11T12:00:00.000Z');

describe('AdminProjectUpdatesService', () => {
  const requireAdmin = jest.fn<
    ReturnType<AdminAccessService['requireAdmin']>,
    [clerkUserId: string]
  >();
  const findProject = jest.fn<
    Promise<{ id: string } | null>,
    [args: unknown]
  >();
  const findMany = jest.fn<Promise<UpdateRecord[]>, [args: unknown]>();
  const findFirst = jest.fn<Promise<UpdateRecord | null>, [args: unknown]>();
  const create = jest.fn<Promise<UpdateRecord>, [args: unknown]>();
  const update = jest.fn<Promise<UpdateRecord>, [args: unknown]>();
  const database = {
    project: { findFirst: findProject },
    projectUpdate: { findMany, findFirst, create, update },
  } as unknown as DatabaseClient;
  const access = { requireAdmin } as unknown as AdminAccessService;
  const service = new AdminProjectUpdatesService(database, access);
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    requireAdmin.mockResolvedValue({
      userId: 'admin-1',
      platformRole: 'ADMIN',
    });
    findProject.mockResolvedValue({ id: 'project-1' });
    findMany.mockResolvedValue([record]);
    findFirst.mockResolvedValue(record);
    create.mockResolvedValue(record);
    update.mockResolvedValue(record);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe.each([
    {
      label: 'list',
      run: () => service.findForProject('clerk-admin', 'client-1', 'project-1'),
    },
    {
      label: 'detail',
      run: () =>
        service.findOne('clerk-admin', 'client-1', 'project-1', 'update-1'),
    },
    {
      label: 'create',
      run: () => service.create('clerk-admin', 'client-1', 'project-1', input),
    },
    {
      label: 'edit',
      run: () =>
        service.update('clerk-admin', 'client-1', 'project-1', 'update-1', {
          ...input,
          publication: { mode: 'KEEP' },
        }),
    },
  ])('$label authorization', ({ run }) => {
    it('requires ADMIN before any project/update access', async () => {
      const error = new ForbiddenException();
      requireAdmin.mockRejectedValue(error);
      await expect(run()).rejects.toBe(error);
      expect(requireAdmin).toHaveBeenCalledWith('clerk-admin');
      expect(findProject).not.toHaveBeenCalled();
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
    it('rejects missing or mismatched parents before any update access', async () => {
      findProject.mockResolvedValue(null);
      await expect(run()).rejects.toThrow(NotFoundException);
      expect(findProject).toHaveBeenCalledWith({
        where: { id: 'project-1', clientId: 'client-1' },
        select: { id: true },
      });
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });
  it('requests all publication states with only safe author fields', async () => {
    await expect(
      service.findForProject('clerk-admin', 'client-1', 'project-1'),
    ).resolves.toEqual([serialized]);
    expect(findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', project: { clientId: 'client-1' } },
      select,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  });
  it('supports empty projects', async () => {
    findMany.mockResolvedValue([]);
    await expect(
      service.findForProject('clerk-admin', 'client-1', 'project-1'),
    ).resolves.toEqual([]);
  });
  it('scopes detail to the update, project, and client', async () => {
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-1', 'update-1'),
    ).resolves.toEqual(serialized);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'update-1',
        projectId: 'project-1',
        project: { clientId: 'client-1' },
      },
      select,
    });
  });
  it('returns 404 when no update matches the scoped detail query', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-1', 'other'),
    ).rejects.toThrow(NotFoundException);
  });
  it('retains history with a deleted author and serializes the publication instant', async () => {
    findFirst.mockResolvedValue({
      ...record,
      authorUserId: null,
      author: null,
      publishedAt: new Date('2026-09-10T14:30:27.345Z'),
    });
    const result = await service.findOne(
      'clerk-admin',
      'client-1',
      'project-1',
      'update-1',
    );
    expect(result.author).toBeNull();
    expect(result.authorUserId).toBeNull();
    expect(result.publishedAt).toBe('2026-09-10T14:30:27.345Z');
  });
  it('creates a draft attributed to the authenticated local user', async () => {
    requireAdmin.mockResolvedValue({
      userId: 'local-admin-2',
      platformRole: 'ADMIN',
    });
    await expect(
      service.create('clerk-admin', 'client-1', 'project-1', input),
    ).resolves.toEqual(serialized);
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        publishedAt: null,
        project: { connect: { id: 'project-1', clientId: 'client-1' } },
        author: { connect: { id: 'local-admin-2' } },
      },
      select,
    });
  });
  it('uses server time when publishing immediately', async () => {
    await service.create('clerk-admin', 'client-1', 'project-1', {
      ...input,
      publication: { mode: 'PUBLISH_NOW' },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        publishedAt: now,
        project: { connect: { id: 'project-1', clientId: 'client-1' } },
        author: { connect: { id: 'admin-1' } },
      },
      select,
    });
  });
  it('creates scheduled posts at the exact requested UTC instant', async () => {
    const publishedAt = '2026-09-11T12:30:00.000Z';
    await service.create('clerk-admin', 'client-1', 'project-1', {
      ...input,
      publication: { mode: 'SCHEDULE', publishedAt },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        publishedAt: new Date(publishedAt),
        project: { connect: { id: 'project-1', clientId: 'client-1' } },
        author: { connect: { id: 'admin-1' } },
      },
      select,
    });
  });
  it('KEEP omits publication and attribution from the scoped write', async () => {
    const oldTime = new Date('2026-09-10T14:30:27.345Z');
    update.mockResolvedValue({
      ...record,
      authorUserId: null,
      author: null,
      publishedAt: oldTime,
    });
    const result = await service.update(
      'clerk-admin',
      'client-1',
      'project-1',
      'update-1',
      { ...input, publication: { mode: 'KEEP' } },
    );
    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'update-1',
        projectId: 'project-1',
        project: { clientId: 'client-1' },
      },
      data: input,
      select,
    });
    expect(result.publishedAt).toBe(oldTime.toISOString());
    expect(result.author).toBeNull();
  });
  it.each([
    { mode: 'DRAFT', expected: null },
    { mode: 'PUBLISH_NOW', expected: now },
    {
      mode: 'SCHEDULE',
      publishedAt: '2026-09-12T12:00:00.000Z',
      expected: new Date('2026-09-12T12:00:00.000Z'),
    },
  ])(
    'applies $mode without changing the original author',
    async ({ mode, publishedAt, expected }) => {
      await service.update('clerk-admin', 'client-1', 'project-1', 'update-1', {
        ...input,
        publication: mode === 'SCHEDULE' ? { mode, publishedAt } : { mode },
      });
      expect(update).toHaveBeenCalledWith({
        where: {
          id: 'update-1',
          projectId: 'project-1',
          project: { clientId: 'client-1' },
        },
        data: { ...input, publishedAt: expected },
        select,
      });
    },
  );
  it.each(['2026-09-11T11:59:59.999Z', '2026-09-11T12:00:00.000Z'])(
    'rejects scheduling at or before server time: %s',
    async (publishedAt) => {
      const data = { ...input, publication: { mode: 'SCHEDULE', publishedAt } };
      await expect(
        service.create('clerk-admin', 'client-1', 'project-1', data),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(
          'clerk-admin',
          'client-1',
          'project-1',
          'update-1',
          data,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );
  it('rejects a schedule that expired while the form was open', async () => {
    jest.setSystemTime(new Date('2026-09-11T13:00:00.000Z'));
    await expect(
      service.create('clerk-admin', 'client-1', 'project-1', {
        ...input,
        publication: {
          mode: 'SCHEDULE',
          publishedAt: '2026-09-11T12:30:00.000Z',
        },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
  it.each(['authorUserId', 'projectId', 'publishedAt'])(
    'rejects injected %s without writing',
    async (field) => {
      const data = {
        ...input,
        publication: { mode: 'DRAFT' },
        [field]: 'injected',
      };
      await expect(
        service.create('clerk-admin', 'client-1', 'project-1', data),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(
          'clerk-admin',
          'client-1',
          'project-1',
          'update-1',
          data,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );
  it.each(['P2025', 'P2003'])(
    'maps missing parent/author during creation (%s) to 404',
    async (code) => {
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Missing relation', {
          code,
          clientVersion: 'test',
        }),
      );
      await expect(
        service.create('clerk-admin', 'client-1', 'project-1', input),
      ).rejects.toThrow(NotFoundException);
    },
  );
  it('maps a deleted or mismatched update at write time to 404', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Missing', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update('clerk-admin', 'client-1', 'project-1', 'update-1', {
        ...input,
        publication: { mode: 'KEEP' },
      }),
    ).rejects.toThrow(NotFoundException);
  });
  it('propagates unexpected write errors', async () => {
    const error = new Error('Database unavailable');
    update.mockRejectedValue(error);
    await expect(
      service.update('clerk-admin', 'client-1', 'project-1', 'update-1', {
        ...input,
        publication: { mode: 'KEEP' },
      }),
    ).rejects.toBe(error);
  });
});

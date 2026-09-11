import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  MilestoneStatus,
  Prisma,
  type DatabaseClient,
} from '@algoworld/database';
import type { AdminAccessService } from '../access/admin-access.service';
import { AdminMilestonesService } from './admin-milestones.service';

const select = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  targetDate: true,
  completedAt: true,
  displayOrder: true,
  isVisibleToClient: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectMilestoneSelect;
type MilestoneRecord = Prisma.ProjectMilestoneGetPayload<{
  select: typeof select;
}>;
const input = {
  title: 'Design review',
  description: null,
  status: MilestoneStatus.PENDING,
  targetDate: null,
  completedAt: null,
  displayOrder: 10,
  isVisibleToClient: false,
};
const record: MilestoneRecord = {
  ...input,
  id: 'milestone-1',
  projectId: 'project-1',
  createdAt: new Date('2026-09-11T12:00:00Z'),
  updatedAt: new Date('2026-09-11T12:00:00Z'),
};
const serialized = {
  ...record,
  createdAt: '2026-09-11T12:00:00.000Z',
  updatedAt: '2026-09-11T12:00:00.000Z',
};

describe('AdminMilestonesService', () => {
  const requireAdmin = jest.fn<
    ReturnType<AdminAccessService['requireAdmin']>,
    [clerkUserId: string]
  >();
  const findProject = jest.fn<
    Promise<{ id: string } | null>,
    [args: unknown]
  >();
  const findMany = jest.fn<Promise<MilestoneRecord[]>, [args: unknown]>();
  const findFirst = jest.fn<Promise<MilestoneRecord | null>, [args: unknown]>();
  const create = jest.fn<Promise<MilestoneRecord>, [args: unknown]>();
  const update = jest.fn<Promise<MilestoneRecord>, [args: unknown]>();
  const database = {
    project: { findFirst: findProject },
    projectMilestone: { findMany, findFirst, create, update },
  } as unknown as DatabaseClient;
  const access = { requireAdmin } as unknown as AdminAccessService;
  const service = new AdminMilestonesService(database, access);
  beforeEach(() => {
    jest.resetAllMocks();
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

  describe.each([
    {
      label: 'list',
      run: () => service.findForProject('clerk-admin', 'client-1', 'project-1'),
    },
    {
      label: 'detail',
      run: () =>
        service.findOne('clerk-admin', 'client-1', 'project-1', 'milestone-1'),
    },
    {
      label: 'create',
      run: () => service.create('clerk-admin', 'client-1', 'project-1', input),
    },
    {
      label: 'update',
      run: () =>
        service.update(
          'clerk-admin',
          'client-1',
          'project-1',
          'milestone-1',
          input,
        ),
    },
  ])('$label authorization', ({ run }) => {
    it('checks ADMIN access before touching project or milestone records', async () => {
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
    it('rejects a missing project or mismatched client before querying milestones', async () => {
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
  it('includes hidden milestones and requests a stable order under the exact parent', async () => {
    await expect(
      service.findForProject('clerk-admin', 'client-1', 'project-1'),
    ).resolves.toEqual([serialized]);
    // Mocks verify query requirements; database filtering itself needs integration testing.
    expect(findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', project: { clientId: 'client-1' } },
      select,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  });
  it('returns an empty list for a project without milestones', async () => {
    findMany.mockResolvedValue([]);
    await expect(
      service.findForProject('clerk-admin', 'client-1', 'project-1'),
    ).resolves.toEqual([]);
  });
  it('scopes detail to the milestone, project, and client', async () => {
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-1', 'milestone-1'),
    ).resolves.toEqual(serialized);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'milestone-1',
        projectId: 'project-1',
        project: { clientId: 'client-1' },
      },
      select,
    });
  });
  it('returns 404 for a missing or mismatched milestone', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.findOne('clerk-admin', 'client-1', 'project-1', 'other'),
    ).rejects.toThrow(NotFoundException);
  });
  it('serializes optional dates explicitly to ISO strings', async () => {
    findFirst.mockResolvedValue({
      ...record,
      targetDate: new Date('2026-10-01T00:00:00Z'),
      completedAt: new Date('2026-09-30T00:00:00Z'),
    });
    const result = await service.findOne(
      'clerk-admin',
      'client-1',
      'project-1',
      'milestone-1',
    );
    expect(result.targetDate).toBe('2026-10-01T00:00:00.000Z');
    expect(result.completedAt).toBe('2026-09-30T00:00:00.000Z');
  });
  it('creates hidden pending milestones and connects using the scoped route IDs', async () => {
    await expect(
      service.create('clerk-admin', 'client-1', 'project-1', {
        title: '  Design review  ',
      }),
    ).resolves.toEqual(serialized);
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        displayOrder: 0,
        project: { connect: { id: 'project-1', clientId: 'client-1' } },
      },
      select,
    });
  });
  it('converts calendar dates to UTC midnight', async () => {
    await service.create('clerk-admin', 'client-1', 'project-1', {
      ...input,
      targetDate: '2026-10-01',
      completedAt: '2026-09-30',
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        ...input,
        targetDate: new Date('2026-10-01T00:00:00Z'),
        completedAt: new Date('2026-09-30T00:00:00Z'),
        project: { connect: { id: 'project-1', clientId: 'client-1' } },
      },
      select,
    });
  });
  it('scopes the update itself and permits clearing dates and changing visibility/order', async () => {
    const changes = { ...input, displayOrder: 20, isVisibleToClient: true };
    await service.update(
      'clerk-admin',
      'client-1',
      'project-1',
      'milestone-1',
      changes,
    );
    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'milestone-1',
        projectId: 'project-1',
        project: { clientId: 'client-1' },
      },
      data: changes,
      select,
    });
  });
  it.each([
    {
      label: 'create',
      run: () =>
        service.create('clerk-admin', 'client-1', 'project-1', {
          ...input,
          title: '',
        }),
    },
    {
      label: 'update',
      run: () =>
        service.update('clerk-admin', 'client-1', 'project-1', 'milestone-1', {
          ...input,
          displayOrder: 0.5,
        }),
    },
    {
      label: 'parent reassignment',
      run: () =>
        service.update('clerk-admin', 'client-1', 'project-1', 'milestone-1', {
          ...input,
          projectId: 'other',
        }),
    },
  ])('rejects invalid $label without writing', async ({ run }) => {
    await expect(run()).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it.each(['P2025', 'P2003'])(
    'maps create failure %s to a concealed 404',
    async (code) => {
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Parent missing', {
          code,
          clientVersion: 'test',
        }),
      );
      await expect(
        service.create('clerk-admin', 'client-1', 'project-1', input),
      ).rejects.toThrow(NotFoundException);
    },
  );
  it('returns 404 if the scoped update matches nothing or the record was deleted', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Missing', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update(
        'clerk-admin',
        'client-1',
        'project-1',
        'milestone-1',
        input,
      ),
    ).rejects.toThrow(NotFoundException);
  });
  it('propagates unexpected write failures', async () => {
    const error = new Error('Database unavailable');
    update.mockRejectedValue(error);
    await expect(
      service.update(
        'clerk-admin',
        'client-1',
        'project-1',
        'milestone-1',
        input,
      ),
    ).rejects.toBe(error);
  });
});

import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  MilestoneStatus,
  ProjectStatus,
  type DatabaseClient,
} from '@algoworld/database';

import type { ClientsService } from '../clients/clients.service';
import { ProjectsService } from './projects.service';
import type {
  ClientProjectUpdateSummary,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateSummary,
} from './projects.types';

type StoredUpdate = Omit<ProjectUpdateSummary, 'publishedAt'> & {
  publishedAt: Date | null;
};

type StoredClientUpdate = Omit<ClientProjectUpdateSummary, 'publishedAt'> & {
  publishedAt: Date | null;
};

describe('ProjectsService', () => {
  const now = new Date('2026-09-08T12:00:00.000Z');

  const findOneAccessibleTo = jest.fn<
    Promise<unknown>,
    [clerkUserId: string, clientId: string]
  >();

  const findMany = jest.fn<Promise<ProjectSummary[]>, [args: unknown]>();

  const findFirst = jest.fn<
    Promise<ProjectDetail | { updates: StoredUpdate[] } | null>,
    [args: unknown]
  >();

  const findUpdateMany = jest.fn<
    Promise<StoredClientUpdate[]>,
    [args: unknown]
  >();

  const database = {
    project: {
      findMany,
      findFirst,
    },
    projectUpdate: {
      findMany: findUpdateMany,
    },
  } as unknown as DatabaseClient;

  const clientsService = {
    findOneAccessibleTo,
  } as unknown as ClientsService;

  const service = new ProjectsService(database, clientsService);

  const project: ProjectDetail = {
    id: 'project-1',
    name: 'Client Portal',
    description: 'Build the client portal.',
    status: ProjectStatus.IN_PROGRESS,
    startDate: null,
    targetEndDate: null,
    completedAt: null,
    milestones: [
      {
        id: 'milestone-1',
        title: 'Authentication',
        description: 'Secure the portal.',
        status: MilestoneStatus.COMPLETED,
        targetDate: null,
        completedAt: new Date('2026-09-07T12:00:00.000Z'),
        displayOrder: 1,
      },
    ],
  };

  const publishedUpdate: ProjectUpdateSummary = {
    id: 'update-1',
    title: 'Project underway',
    content: 'We have started building your website.',
    authorUserId: 'local-user-1',
    publishedAt: new Date('2026-09-07T12:00:00.000Z'),
  };

  beforeEach(() => {
    // Clear implementations as well as call history, including rejections.
    jest.resetAllMocks();
    jest.useFakeTimers({ now });
    findOneAccessibleTo.mockResolvedValue({});
    findMany.mockResolvedValue([]);
    findFirst.mockResolvedValue(null);
    findUpdateMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns visible projects for an accessible client', async () => {
    const projects: ProjectSummary[] = [
      {
        id: 'project-1',
        name: 'Website redesign',
        description: 'Rebuild the public website.',
        status: ProjectStatus.IN_PROGRESS,
        startDate: null,
        targetEndDate: null,
        completedAt: null,
      },
    ];

    findMany.mockResolvedValue(projects);

    await expect(
      service.findVisibleForClient('clerk-user-1', 'client-1'),
    ).resolves.toEqual(projects);

    expect(findOneAccessibleTo).toHaveBeenCalledWith(
      'clerk-user-1',
      'client-1',
    );
    expect(findMany).toHaveBeenCalledWith({
      where: {
        clientId: 'client-1',
        isVisibleToClient: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        targetEndDate: true,
        completedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('returns a visible project with ordered visible milestones', async () => {
    findFirst.mockResolvedValue(project);

    await expect(
      service.findOneVisibleForClient('clerk-user-1', 'client-1', 'project-1'),
    ).resolves.toEqual(project);

    expect(findOneAccessibleTo).toHaveBeenCalledWith(
      'clerk-user-1',
      'client-1',
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'project-1',
        clientId: 'client-1',
        isVisibleToClient: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        targetEndDate: true,
        completedAt: true,
        milestones: {
          where: {
            isVisibleToClient: true,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            targetDate: true,
            completedAt: true,
            displayOrder: true,
          },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
  });

  it('returns 404 when the visible project lookup finds no match', async () => {
    await expect(
      service.findOneVisibleForClient(
        'clerk-user-1',
        'client-1',
        'inaccessible-project',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  describe.each([
    {
      label: 'project list',
      run: () => service.findVisibleForClient('clerk-user-1', 'client-1'),
    },
    {
      label: 'project detail',
      run: () =>
        service.findOneVisibleForClient(
          'clerk-user-1',
          'client-1',
          'project-1',
        ),
    },
    {
      label: 'project updates',
      run: () =>
        service.findPublishedUpdatesForClient(
          'clerk-user-1',
          'client-1',
          'project-1',
        ),
    },
    {
      label: 'client updates',
      run: () =>
        service.findLatestPublishedUpdatesForClient('clerk-user-1', 'client-1'),
    },
  ])('$label authorization', ({ run }) => {
    it.each([
      ['inaccessible client', new NotFoundException('Client not found.')],
      ['inactive user', new ForbiddenException('No active platform account.')],
    ])('stops before querying data for an %s', async (_label, error) => {
      findOneAccessibleTo.mockRejectedValue(error);

      await expect(run()).rejects.toBe(error);

      expect(findOneAccessibleTo).toHaveBeenCalledWith(
        'clerk-user-1',
        'client-1',
      );
      expect(findMany).not.toHaveBeenCalled();
      expect(findFirst).not.toHaveBeenCalled();
      expect(findUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe('project updates', () => {
    it('requests only published updates under the matching visible project', async () => {
      findFirst.mockResolvedValue({ updates: [publishedUpdate] });

      await expect(
        service.findPublishedUpdatesForClient(
          'clerk-user-1',
          'client-1',
          'project-1',
        ),
      ).resolves.toEqual([publishedUpdate]);

      expect(findOneAccessibleTo).toHaveBeenCalledWith(
        'clerk-user-1',
        'client-1',
      );
      // These assertions protect database query constraints. The mock does
      // not execute SQL or prove that database filtering works.
      expect(findFirst).toHaveBeenCalledTimes(1);
      expect(findFirst.mock.calls[0]?.[0]).toMatchObject({
        where: {
          id: 'project-1',
          clientId: 'client-1',
          isVisibleToClient: true,
        },
        select: {
          updates: {
            where: { publishedAt: { not: null, lte: now } },
            orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
            take: 50,
          },
        },
      });
    });

    it('returns an empty list when the accessible project has no published updates', async () => {
      findFirst.mockResolvedValue({ updates: [] });

      await expect(
        service.findPublishedUpdatesForClient(
          'clerk-user-1',
          'client-1',
          'project-1',
        ),
      ).resolves.toEqual([]);
    });

    it('returns 404 when the parent project lookup finds no match', async () => {
      await expect(
        service.findPublishedUpdatesForClient(
          'clerk-user-1',
          'client-1',
          'inaccessible-project',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('preserves a published update whose author was deleted', async () => {
      const update = { ...publishedUpdate, authorUserId: null };
      findFirst.mockResolvedValue({ updates: [update] });

      await expect(
        service.findPublishedUpdatesForClient(
          'clerk-user-1',
          'client-1',
          'project-1',
        ),
      ).resolves.toEqual([update]);
    });
  });

  describe('client updates', () => {
    it("requests the newest five published updates from this client's visible projects", async () => {
      const updates: ClientProjectUpdateSummary[] = [
        {
          ...publishedUpdate,
          publishedAt: now,
          project: { id: 'project-1', name: 'Website' },
        },
        {
          ...publishedUpdate,
          id: 'update-2',
          project: { id: 'project-2', name: 'Client Portal' },
        },
      ];
      findUpdateMany.mockResolvedValue(updates);

      await expect(
        service.findLatestPublishedUpdatesForClient('clerk-user-1', 'client-1'),
      ).resolves.toEqual(updates);

      expect(findOneAccessibleTo).toHaveBeenCalledWith(
        'clerk-user-1',
        'client-1',
      );
      expect(findUpdateMany).toHaveBeenCalledTimes(1);
      expect(findUpdateMany.mock.calls[0]?.[0]).toMatchObject({
        where: {
          project: { clientId: 'client-1', isVisibleToClient: true },
          publishedAt: { not: null, lte: now },
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take: 5,
      });
    });

    it('returns an empty list when no published updates match', async () => {
      await expect(
        service.findLatestPublishedUpdatesForClient('clerk-user-1', 'client-1'),
      ).resolves.toEqual([]);
    });
  });
});

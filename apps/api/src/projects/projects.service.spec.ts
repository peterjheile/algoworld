import { NotFoundException } from '@nestjs/common';

import {
  ProjectStatus,
  MilestoneStatus,
  type DatabaseClient,
} from '@algoworld/database';

import type { ClientsService } from '../clients/clients.service';
import { ProjectsService } from './projects.service';
import type { ProjectDetail, ProjectSummary } from './projects.types';

describe('ProjectsService', () => {
  const findOneAccessibleTo = jest.fn<
    Promise<unknown>,
    [clerkUserId: string, clientId: string]
  >();

  const findMany = jest.fn<Promise<ProjectSummary[]>, [args: unknown]>();

  const findFirst = jest.fn<Promise<ProjectDetail | null>, [args: unknown]>();

  const database = {
    project: {
      findMany,
      findFirst,
    },
  } as unknown as DatabaseClient;

  const clientsService = {
    findOneAccessibleTo,
  } as unknown as ClientsService;

  const service = new ProjectsService(database, clientsService);

  beforeEach(() => {
    jest.clearAllMocks();
    findOneAccessibleTo.mockResolvedValue({});
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

  it('does not query projects for an inaccessible client', async () => {
    findOneAccessibleTo.mockRejectedValue(
      new NotFoundException('Client not found.'),
    );

    await expect(
      service.findVisibleForClient('clerk-user-1', 'inaccessible-client'),
    ).rejects.toThrow(NotFoundException);

    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns a visible project with ordered visible milestones', async () => {
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
          completedAt: null,
          displayOrder: 1,
        },
      ],
    };

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
          orderBy: [
            {
              displayOrder: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
        },
      },
    });
  });

  it('hides missing, mismatched or invisible projects behind a 404', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      service.findOneVisibleForClient(
        'clerk-user-1',
        'client-1',
        'inaccessible-project',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});

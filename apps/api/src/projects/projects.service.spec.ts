import { NotFoundException } from '@nestjs/common';

import { ProjectStatus, type DatabaseClient } from '@algoworld/database';

import type { ClientsService } from '../clients/clients.service';
import { ProjectsService } from './projects.service';
import type { ProjectSummary } from './projects.types';

describe('ProjectsService', () => {
  const findOneAccessibleTo = jest.fn<
    Promise<unknown>,
    [clerkUserId: string, clientId: string]
  >();

  const findMany = jest.fn<Promise<ProjectSummary[]>, [args: unknown]>();

  const database = {
    project: {
      findMany,
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
});

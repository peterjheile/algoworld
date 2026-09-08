import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { DatabaseClient } from '@algoworld/database';

import { ClientsService } from '../clients/clients.service';
import { DATABASE_CLIENT } from '../database/database.constants';
import type {
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateSummary,
  ClientProjectUpdateSummary,
} from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
    private readonly clientsService: ClientsService,
  ) {}

  async findVisibleForClient(
    clerkUserId: string,
    clientId: string,
  ): Promise<ProjectSummary[]> {
    await this.clientsService.findOneAccessibleTo(clerkUserId, clientId);

    return this.database.project.findMany({
      where: {
        clientId,
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
  }

  async findOneVisibleForClient(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<ProjectDetail> {
    await this.clientsService.findOneAccessibleTo(clerkUserId, clientId);

    const project = await this.database.project.findFirst({
      where: {
        id: projectId,
        clientId,
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

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  async findPublishedUpdatesForClient(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<ProjectUpdateSummary[]> {
    await this.clientsService.findOneAccessibleTo(clerkUserId, clientId);

    const now = new Date();

    const project = await this.database.project.findFirst({
      where: {
        id: projectId,
        clientId,
        isVisibleToClient: true,
      },
      select: {
        updates: {
          where: {
            publishedAt: {
              not: null,
              lte: now,
            },
          },
          select: {
            id: true,
            title: true,
            content: true,
            authorUserId: true,
            publishedAt: true,
          },
          orderBy: [
            {
              publishedAt: 'desc',
            },
            {
              id: 'desc',
            },
          ],
          take: 50,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Prisma retains the nullable database type despite the query filter.
    return project.updates.flatMap(({ publishedAt, ...update }) =>
      publishedAt === null ? [] : [{ ...update, publishedAt }],
    );
  }

  async findLatestPublishedUpdatesForClient(
    clerkUserId: string,
    clientId: string,
  ): Promise<ClientProjectUpdateSummary[]> {
    await this.clientsService.findOneAccessibleTo(clerkUserId, clientId);

    const updates = await this.database.projectUpdate.findMany({
      where: {
        project: {
          clientId,
          isVisibleToClient: true,
        },
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        authorUserId: true,
        publishedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: 5,
    });

    return updates.flatMap(({ publishedAt, ...update }) =>
      publishedAt === null ? [] : [{ ...update, publishedAt }],
    );
  }
}

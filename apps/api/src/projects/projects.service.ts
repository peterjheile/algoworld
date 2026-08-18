import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { DatabaseClient } from '@algoworld/database';

import { ClientsService } from '../clients/clients.service';
import { DATABASE_CLIENT } from '../database/database.constants';
import type { ProjectDetail, ProjectSummary } from './projects.types';

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
}

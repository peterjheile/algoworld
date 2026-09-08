import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { ProjectsService } from './projects.service';
import type {
  ProjectDetail,
  ProjectSummary,
  ProjectUpdateSummary,
  ClientProjectUpdateSummary,
} from './projects.types';

@UseGuards(ClerkAuthGuard)
@Controller('clients/:clientId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<ProjectSummary[]> {
    return this.projectsService.findVisibleForClient(clerkUserId, clientId);
  }

  @Get('updates')
  async findLatestUpdates(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<ClientProjectUpdateSummary[]> {
    return this.projectsService.findLatestPublishedUpdatesForClient(
      clerkUserId,
      clientId,
    );
  }

  @Get(':projectId')
  async findOne(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ): Promise<ProjectDetail> {
    return this.projectsService.findOneVisibleForClient(
      clerkUserId,
      clientId,
      projectId,
    );
  }

  @Get(':projectId/updates')
  async findUpdates(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ): Promise<ProjectUpdateSummary[]> {
    return this.projectsService.findPublishedUpdatesForClient(
      clerkUserId,
      clientId,
      projectId,
    );
  }
}

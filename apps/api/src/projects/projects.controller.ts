import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { ProjectsService } from './projects.service';
import type { ProjectSummary } from './projects.types';

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
}

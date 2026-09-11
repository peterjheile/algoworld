import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../../auth/current-clerk-user-id.decorator';
import { AdminMilestonesService } from './admin-milestones.service';
import type { AdminMilestone } from './admin-milestones.types';

@UseGuards(ClerkAuthGuard)
@Controller('admin/clients/:clientId/projects/:projectId/milestones')
export class AdminMilestonesController {
  constructor(private readonly milestones: AdminMilestonesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async findAll(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ): Promise<AdminMilestone[]> {
    return this.milestones.findForProject(clerkUserId, clientId, projectId);
  }

  @Get(':milestoneId')
  @Header('Cache-Control', 'private, no-store')
  async findOne(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ): Promise<AdminMilestone> {
    return this.milestones.findOne(
      clerkUserId,
      clientId,
      projectId,
      milestoneId,
    );
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<AdminMilestone> {
    return this.milestones.create(clerkUserId, clientId, projectId, body);
  }

  @Put(':milestoneId')
  @Header('Cache-Control', 'private, no-store')
  async update(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: unknown,
  ): Promise<AdminMilestone> {
    return this.milestones.update(
      clerkUserId,
      clientId,
      projectId,
      milestoneId,
      body,
    );
  }
}

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
import { AdminProjectUpdatesService } from './admin-project-updates.service';
import type { AdminProjectUpdate } from './admin-project-updates.types';

@UseGuards(ClerkAuthGuard)
@Controller('admin/clients/:clientId/projects/:projectId/updates')
export class AdminProjectUpdatesController {
  constructor(private readonly updates: AdminProjectUpdatesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async findAll(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ): Promise<AdminProjectUpdate[]> {
    return this.updates.findForProject(clerkUserId, clientId, projectId);
  }

  @Get(':updateId')
  @Header('Cache-Control', 'private, no-store')
  async findOne(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Param('updateId') updateId: string,
  ): Promise<AdminProjectUpdate> {
    return this.updates.findOne(clerkUserId, clientId, projectId, updateId);
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<AdminProjectUpdate> {
    return this.updates.create(clerkUserId, clientId, projectId, body);
  }

  @Put(':updateId')
  @Header('Cache-Control', 'private, no-store')
  async update(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Param('updateId') updateId: string,
    @Body() body: unknown,
  ): Promise<AdminProjectUpdate> {
    return this.updates.update(
      clerkUserId,
      clientId,
      projectId,
      updateId,
      body,
    );
  }
}

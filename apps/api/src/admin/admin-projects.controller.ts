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
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { AdminProjectsService } from './admin-projects.service';
import type { AdminProject } from './admin-projects.types';

@UseGuards(ClerkAuthGuard)
@Controller('admin/clients/:clientId/projects')
export class AdminProjectsController {
  constructor(private readonly projects: AdminProjectsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async findAll(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<AdminProject[]> {
    return this.projects.findForClient(clerkUserId, clientId);
  }

  @Get(':projectId')
  @Header('Cache-Control', 'private, no-store')
  async findOne(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ): Promise<AdminProject> {
    return this.projects.findOne(clerkUserId, clientId, projectId);
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Body() body: unknown,
  ): Promise<AdminProject> {
    return this.projects.create(clerkUserId, clientId, body);
  }

  @Put(':projectId')
  @Header('Cache-Control', 'private, no-store')
  async update(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<AdminProject> {
    return this.projects.update(clerkUserId, clientId, projectId, body);
  }
}

import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { AdminAccessService } from './admin-access.service';
import { AdminClientsService } from './admin-clients.service';
import type {
  AdminClientDetail,
  AdminClientSummary,
  AdminSession,
} from './admin.types';

@UseGuards(ClerkAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminAccessService: AdminAccessService,
    private readonly adminClientsService: AdminClientsService,
  ) {}

  @Get('session')
  @Header('Cache-Control', 'private, no-store')
  async getSession(
    @CurrentClerkUserId() clerkUserId: string,
  ): Promise<AdminSession> {
    return this.adminAccessService.requireAdmin(clerkUserId);
  }

  @Get('clients')
  @Header('Cache-Control', 'private, no-store')
  async findClients(
    @CurrentClerkUserId() clerkUserId: string,
  ): Promise<AdminClientSummary[]> {
    return this.adminClientsService.findAll(clerkUserId);
  }

  @Get('clients/:clientId')
  @Header('Cache-Control', 'private, no-store')
  async findClient(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<AdminClientDetail> {
    return this.adminClientsService.findOne(clerkUserId, clientId);
  }

  @Post('clients')
  @Header('Cache-Control', 'private, no-store')
  async createClient(
    @CurrentClerkUserId() clerkUserId: string,
    @Body() body: unknown,
  ): Promise<AdminClientDetail> {
    return this.adminClientsService.create(clerkUserId, body);
  }

  @Patch('clients/:clientId')
  @Header('Cache-Control', 'private, no-store')
  async updateClient(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Body() body: unknown,
  ): Promise<AdminClientDetail> {
    return this.adminClientsService.update(clerkUserId, clientId, body);
  }
}

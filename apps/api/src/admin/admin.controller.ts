import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { AdminAccessService } from './admin-access.service';
import { AdminClientsService } from './admin-clients.service';
import { AdminMembershipsService } from './admin-memberships.service';
import type {
  AdminClientMembership,
  AdminMembershipUser,
} from './admin-memberships.types';
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
    private readonly adminMembershipsService: AdminMembershipsService,
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

  @Get('clients/:clientId/memberships')
  @Header('Cache-Control', 'private, no-store')
  async findMemberships(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<AdminClientMembership[]> {
    return this.adminMembershipsService.findForClient(clerkUserId, clientId);
  }

  @Post('clients/:clientId/memberships')
  @Header('Cache-Control', 'private, no-store')
  async createMembership(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Body() body: unknown,
  ): Promise<AdminClientMembership> {
    return this.adminMembershipsService.createForClient(
      clerkUserId,
      clientId,
      body,
    );
  }

  @Patch('clients/:clientId/memberships/:userId')
  @Header('Cache-Control', 'private, no-store')
  async updateMembership(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<AdminClientMembership> {
    return this.adminMembershipsService.updateForClient(
      clerkUserId,
      clientId,
      userId,
      body,
    );
  }

  @Delete('clients/:clientId/memberships/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'private, no-store')
  async removeMembership(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.adminMembershipsService.removeForClient(
      clerkUserId,
      clientId,
      userId,
    );
  }

  @Get('clients/:clientId/available-users')
  @Header('Cache-Control', 'private, no-store')
  async findAvailableUsers(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
    @Query('q') query: unknown,
  ): Promise<AdminMembershipUser[]> {
    return this.adminMembershipsService.findAvailableUsersForClient(
      clerkUserId,
      clientId,
      query,
    );
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

import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import type { Client } from '@algoworld/database';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentClerkUserId } from '../auth/current-clerk-user-id.decorator';
import { ClientsService } from './clients.service';

@UseGuards(ClerkAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@CurrentClerkUserId() clerkUserId: string): Promise<Client[]> {
    return this.clientsService.findAccessibleTo(clerkUserId);
  }

  @Get(':clientId')
  async findOne(
    @CurrentClerkUserId() clerkUserId: string,
    @Param('clientId') clientId: string,
  ): Promise<Client> {
    return this.clientsService.findOneAccessibleTo(clerkUserId, clientId);
  }
}

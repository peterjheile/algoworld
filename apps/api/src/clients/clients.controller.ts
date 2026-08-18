import { Controller, Get, UseGuards } from '@nestjs/common';

import type { Client } from '@algoworld/database';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClientsService } from './clients.service';

@UseGuards(ClerkAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }
}

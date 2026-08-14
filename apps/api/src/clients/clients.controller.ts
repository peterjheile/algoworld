import { Controller, Get } from '@nestjs/common';

import type { Client } from '@algoworld/database';

import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }
}

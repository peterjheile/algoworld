import { Inject, Injectable } from '@nestjs/common';

import type { Client, DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.database.client.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}

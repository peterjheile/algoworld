import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';

import type { DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from './database.constants';

@Injectable()
export class DatabaseLifecycleService
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.database.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.database.$disconnect();
  }
}

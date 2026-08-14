import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { createDatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from './database.constants';
import { DatabaseLifecycleService } from './database-lifecycle.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDatabaseClient(configService.getOrThrow<string>('DATABASE_URL')),
    },
    DatabaseLifecycleService,
  ],
  exports: [DATABASE_CLIENT],
})
export class DatabaseModule {}

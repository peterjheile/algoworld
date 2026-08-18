import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ClientsModule } from './clients/clients.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProjectsModule } from './projects/projects.module';

import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    HealthModule,
    DatabaseModule,
    ClientsModule,
    WebhooksModule,
    ProjectsModule,
  ],
})
export class AppModule {}

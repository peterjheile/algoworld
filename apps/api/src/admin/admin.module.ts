import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminAccessService } from './admin-access.service';
import { AdminClientsService } from './admin-clients.service';
import { AdminMembershipsService } from './admin-memberships.service';
import { AdminController } from './admin.controller';
import { AdminProjectsController } from './admin-projects.controller';
import { AdminProjectsService } from './admin-projects.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AdminController, AdminProjectsController],
  providers: [
    AdminAccessService,
    AdminClientsService,
    AdminMembershipsService,
    AdminProjectsService,
  ],
  exports: [AdminAccessService],
})
export class AdminModule {}

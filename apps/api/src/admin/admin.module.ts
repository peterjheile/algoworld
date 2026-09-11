import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminAccessService } from './access/admin-access.service';
import { AdminClientsService } from './clients/admin-clients.service';
import { AdminMembershipsService } from './memberships/admin-memberships.service';
import { AdminController } from './admin.controller';
import { AdminProjectsController } from './projects/admin-projects.controller';
import { AdminProjectsService } from './projects/admin-projects.service';
import { AdminMilestonesController } from './milestones/admin-milestones.controller';
import { AdminMilestonesService } from './milestones/admin-milestones.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    AdminController,
    AdminProjectsController,
    AdminMilestonesController,
  ],
  providers: [
    AdminAccessService,
    AdminClientsService,
    AdminMembershipsService,
    AdminProjectsService,
    AdminMilestonesService,
  ],
  exports: [AdminAccessService],
})
export class AdminModule {}

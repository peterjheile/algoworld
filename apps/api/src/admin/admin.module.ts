import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminAccessService } from './admin-access.service';
import { AdminClientsService } from './admin-clients.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AdminController],
  providers: [AdminAccessService, AdminClientsService],
  exports: [AdminAccessService],
})
export class AdminModule {}

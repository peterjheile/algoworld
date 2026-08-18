import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}

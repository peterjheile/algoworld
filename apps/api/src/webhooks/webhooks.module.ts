import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService],
})
export class WebhooksModule {}

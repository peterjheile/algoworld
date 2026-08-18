import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { DatabaseClient } from '@algoworld/database';
import type { WebhookEvent } from '@clerk/backend';

import { DATABASE_CLIENT } from '../database/database.constants';

@Injectable()
export class ClerkWebhooksService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async handle(event: WebhookEvent): Promise<void> {
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const primaryEmail = event.data.email_addresses.find(
        (email) => email.id === event.data.primary_email_address_id,
      )?.email_address;

      if (!primaryEmail) {
        throw new BadRequestException(
          'The Clerk user does not have a primary email address.',
        );
      }

      await this.database.user.upsert({
        where: {
          clerkUserId: event.data.id,
        },
        update: {
          email: primaryEmail,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          isActive: true,
        },
        create: {
          clerkUserId: event.data.id,
          email: primaryEmail,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
        },
      });

      return;
    }

    if (event.type === 'user.deleted' && event.data.id) {
      await this.database.user.updateMany({
        where: {
          clerkUserId: event.data.id,
        },
        data: {
          isActive: false,
        },
      });
    }
  }
}

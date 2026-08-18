import { BadRequestException } from '@nestjs/common';

import type { DatabaseClient } from '@algoworld/database';
import type { WebhookEvent } from '@clerk/backend';

import { ClerkWebhooksService } from './clerk-webhooks.service';

function createUserEvent(
  type: 'user.created' | 'user.updated',
  primaryEmailAddressId = 'email-1',
): WebhookEvent {
  return {
    type,
    data: {
      id: 'clerk-user-1',
      primary_email_address_id: primaryEmailAddressId,
      email_addresses: [
        {
          id: 'email-1',
          email_address: 'peter@example.com',
        },
      ],
      first_name: 'Peter',
      last_name: 'Heile',
    },
  } as unknown as WebhookEvent;
}

describe('ClerkWebhooksService', () => {
  const upsert = jest.fn<Promise<unknown>, [args: unknown]>();
  const updateMany = jest.fn<Promise<unknown>, [args: unknown]>();

  const database = {
    user: {
      upsert,
      updateMany,
    },
  } as unknown as DatabaseClient;

  const service = new ClerkWebhooksService(database);

  beforeEach(() => {
    jest.clearAllMocks();

    upsert.mockResolvedValue({});
    updateMany.mockResolvedValue({
      count: 1,
    });
  });

  it.each(['user.created', 'user.updated'] as const)(
    'upserts the local user for %s',
    async (type) => {
      await service.handle(createUserEvent(type));

      expect(upsert).toHaveBeenCalledWith({
        where: {
          clerkUserId: 'clerk-user-1',
        },
        update: {
          email: 'peter@example.com',
          firstName: 'Peter',
          lastName: 'Heile',
          isActive: true,
        },
        create: {
          clerkUserId: 'clerk-user-1',
          email: 'peter@example.com',
          firstName: 'Peter',
          lastName: 'Heile',
        },
      });

      expect(updateMany).not.toHaveBeenCalled();
    },
  );

  it('deactivates the local user for user.deleted', async () => {
    const event = {
      type: 'user.deleted',
      data: {
        id: 'clerk-user-1',
      },
    } as unknown as WebhookEvent;

    await service.handle(event);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        clerkUserId: 'clerk-user-1',
      },
      data: {
        isActive: false,
      },
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects a user without a primary email address', async () => {
    const event = createUserEvent('user.created', 'missing-email-address');

    await expect(service.handle(event)).rejects.toThrow(BadRequestException);

    expect(upsert).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});

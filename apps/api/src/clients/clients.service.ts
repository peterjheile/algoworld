import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import {
  PlatformRole,
  Prisma,
  type Client,
  type DatabaseClient,
} from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async findAccessibleTo(clerkUserId: string): Promise<Client[]> {
    const user = await this.database.user.findUnique({
      where: {
        clerkUserId,
      },
      select: {
        id: true,
        isActive: true,
        platformRole: true,
      },
    });

    if (!user?.isActive) {
      throw new ForbiddenException(
        'No active platform account is associated with this user.',
      );
    }

    const where: Prisma.ClientWhereInput =
      user.platformRole === PlatformRole.ADMIN
        ? {}
        : {
            memberships: {
              some: {
                userId: user.id,
              },
            },
          };

    return this.database.client.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }
}

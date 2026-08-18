import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PlatformRole,
  Prisma,
  type Client,
  type DatabaseClient,
} from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';

interface ActiveUser {
  id: string;
  platformRole: PlatformRole;
}

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async findAccessibleTo(clerkUserId: string): Promise<Client[]> {
    const user = await this.findActiveUser(clerkUserId);

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

  async findOneAccessibleTo(
    clerkUserId: string,
    clientId: string,
  ): Promise<Client> {
    const user = await this.findActiveUser(clerkUserId);

    const accessWhere: Prisma.ClientWhereInput =
      user.platformRole === PlatformRole.ADMIN
        ? {}
        : {
            memberships: {
              some: {
                userId: user.id,
              },
            },
          };

    const client = await this.database.client.findFirst({
      where: {
        id: clientId,
        ...accessWhere,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    return client;
  }

  private async findActiveUser(clerkUserId: string): Promise<ActiveUser> {
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

    return {
      id: user.id,
      platformRole: user.platformRole,
    };
  }
}

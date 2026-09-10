import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { PlatformRole, type DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';
import type { AdminSession } from './admin.types';

@Injectable()
export class AdminAccessService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async requireAdmin(clerkUserId: string): Promise<AdminSession> {
    const user = await this.database.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        isActive: true,
        platformRole: true,
      },
    });

    if (!user?.isActive || user.platformRole !== PlatformRole.ADMIN) {
      throw new ForbiddenException('Administrator access is required.');
    }

    return {
      userId: user.id,
      platformRole: PlatformRole.ADMIN,
    };
  }
}

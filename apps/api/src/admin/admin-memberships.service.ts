import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';
import { AdminAccessService } from './admin-access.service';
import {
  createAdminMembershipSchema,
  updateAdminMembershipSchema,
} from './admin-membership.schemas';
import type {
  AdminClientMembership,
  AdminMembershipUser,
} from './admin-memberships.types';

const membershipSelect = {
  clientId: true,
  userId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  },
} satisfies Prisma.ClientMembershipSelect;

@Injectable()
export class AdminMembershipsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async findForClient(
    clerkUserId: string,
    clientId: string,
  ): Promise<AdminClientMembership[]> {
    await this.assertClientAccess(clerkUserId, clientId);

    return this.database.clientMembership.findMany({
      where: { clientId },
      select: membershipSelect,
      orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
    });
  }

  async findAvailableUsersForClient(
    clerkUserId: string,
    clientId: string,
    search: unknown,
  ): Promise<AdminMembershipUser[]> {
    await this.assertClientAccess(clerkUserId, clientId);

    if (search !== undefined && typeof search !== 'string') {
      throw new BadRequestException('Provide one search term.');
    }

    const query = typeof search === 'string' ? search.trim() : '';

    if (query.length > 100) {
      throw new BadRequestException(
        'Search terms must be 100 characters or fewer.',
      );
    }

    if (query.length < 2) {
      return [];
    }

    return this.database.user.findMany({
      where: {
        isActive: true,
        memberships: {
          none: { clientId },
        },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
      orderBy: [{ email: 'asc' }, { id: 'asc' }],
      take: 20,
    });
  }

  async createForClient(
    clerkUserId: string,
    clientId: string,
    input: unknown,
  ): Promise<AdminClientMembership> {
    await this.assertClientAccess(clerkUserId, clientId);

    const parsed = createAdminMembershipSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Check the membership details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await this.database.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isActive) {
      throw new BadRequestException({
        message: 'Choose an active user.',
        fieldErrors: {
          userId: ['This user is inactive. Choose an active user.'],
        },
      });
    }

    try {
      return await this.database.clientMembership.create({
        data: {
          clientId,
          userId: user.id,
          role: parsed.data.role,
        },
        select: membershipSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException({
            message: 'This user already belongs to this client.',
            fieldErrors: {
              userId: ['This user already belongs to this client.'],
            },
          });
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('The client or user no longer exists.');
        }
      }
      throw error;
    }
  }

  async updateForClient(
    clerkUserId: string,
    clientId: string,
    userId: string,
    input: unknown,
  ): Promise<AdminClientMembership> {
    await this.assertClientAccess(clerkUserId, clientId);
    const parsed = updateAdminMembershipSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Choose a valid membership role.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      return await this.database.clientMembership.update({
        where: { clientId_userId: { clientId, userId } },
        data: { role: parsed.data.role },
        select: membershipSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Membership not found.');
      }
      throw error;
    }
  }

  async removeForClient(
    clerkUserId: string,
    clientId: string,
    userId: string,
  ): Promise<void> {
    await this.assertClientAccess(clerkUserId, clientId);

    try {
      await this.database.clientMembership.delete({
        where: { clientId_userId: { clientId, userId } },
        select: { clientId: true, userId: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Membership not found.');
      }
      throw error;
    }
  }

  private async assertClientAccess(
    clerkUserId: string,
    clientId: string,
  ): Promise<void> {
    await this.adminAccessService.requireAdmin(clerkUserId);

    const client = await this.database.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }
  }
}

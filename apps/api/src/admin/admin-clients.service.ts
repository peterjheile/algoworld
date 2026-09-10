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
  createAdminClientSchema,
  updateAdminClientSchema,
} from './admin-client.schemas';
import type { AdminClientDetail, AdminClientSummary } from './admin.types';

const summarySelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  _count: { select: { projects: true, memberships: true } },
} satisfies Prisma.ClientSelect;

const detailSelect = {
  ...summarySelect,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

type DetailRow = Prisma.ClientGetPayload<{ select: typeof detailSelect }>;

function toDetail({ _count, ...client }: DetailRow): AdminClientDetail {
  return {
    ...client,
    projectCount: _count.projects,
    membershipCount: _count.memberships,
  };
}

function rethrowWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException({
        message: 'That slug is already in use. Choose another one.',
        fieldErrors: { slug: ['That slug is already in use.'] },
      });
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Client not found.');
    }
  }
  throw error;
}

@Injectable()
export class AdminClientsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async findAll(clerkUserId: string): Promise<AdminClientSummary[]> {
    await this.adminAccessService.requireAdmin(clerkUserId);

    const clients = await this.database.client.findMany({
      select: summarySelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return clients.map(({ _count, ...client }) => ({
      ...client,
      projectCount: _count.projects,
      membershipCount: _count.memberships,
    }));
  }

  async findOne(
    clerkUserId: string,
    clientId: string,
  ): Promise<AdminClientDetail> {
    await this.adminAccessService.requireAdmin(clerkUserId);

    const client = await this.database.client.findUnique({
      where: { id: clientId },
      select: detailSelect,
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    return toDetail(client);
  }

  async create(
    clerkUserId: string,
    input: unknown,
  ): Promise<AdminClientDetail> {
    await this.adminAccessService.requireAdmin(clerkUserId);

    const parsed = createAdminClientSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Check the client details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const client = await this.database.client.create({
        data: parsed.data,
        select: detailSelect,
      });
      return toDetail(client);
    } catch (error) {
      rethrowWriteError(error);
    }
  }

  async update(
    clerkUserId: string,
    clientId: string,
    input: unknown,
  ): Promise<AdminClientDetail> {
    await this.adminAccessService.requireAdmin(clerkUserId);

    const parsed = updateAdminClientSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Provide valid client fields to update.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const client = await this.database.client.update({
        where: { id: clientId },
        data: parsed.data,
        select: detailSelect,
      });
      return toDetail(client);
    } catch (error) {
      rethrowWriteError(error);
    }
  }
}

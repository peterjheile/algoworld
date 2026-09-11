import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';
import { AdminAccessService } from './admin-access.service';
import {
  createAdminProjectSchema,
  updateAdminProjectSchema,
  type AdminProjectInput,
} from './admin-project.schemas';
import type { AdminProject } from './admin-projects.types';

const projectSelect = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  targetEndDate: true,
  completedAt: true,
  isVisibleToClient: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

function toProjectData(input: AdminProjectInput) {
  const toDate = (value: string | null): Date | null =>
    value === null ? null : new Date(`${value}T00:00:00.000Z`);
  return {
    ...input,
    startDate: toDate(input.startDate),
    targetEndDate: toDate(input.targetEndDate),
    completedAt: toDate(input.completedAt),
  };
}

function rethrowProjectWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025')
      throw new NotFoundException('Project not found.');
    if (error.code === 'P2003')
      throw new NotFoundException('Client not found.');
  }
  throw error;
}

@Injectable()
export class AdminProjectsService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async findForClient(
    clerkUserId: string,
    clientId: string,
  ): Promise<AdminProject[]> {
    await this.assertClientAccess(clerkUserId, clientId);
    return this.database.project.findMany({
      where: { clientId },
      select: projectSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  }

  async findOne(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<AdminProject> {
    await this.assertClientAccess(clerkUserId, clientId);
    const project = await this.database.project.findFirst({
      where: { id: projectId, clientId },
      select: projectSelect,
    });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  async create(
    clerkUserId: string,
    clientId: string,
    input: unknown,
  ): Promise<AdminProject> {
    await this.assertClientAccess(clerkUserId, clientId);
    const parsed = createAdminProjectSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Check the project details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      return await this.database.project.create({
        data: { ...toProjectData(parsed.data), clientId },
        select: projectSelect,
      });
    } catch (error) {
      rethrowProjectWriteError(error);
    }
  }

  async update(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    input: unknown,
  ): Promise<AdminProject> {
    await this.assertClientAccess(clerkUserId, clientId);
    const parsed = updateAdminProjectSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Check the project details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      // Include the client in the write itself; a mismatched URL cannot move a project.
      return await this.database.project.update({
        where: { id: projectId, clientId },
        data: toProjectData(parsed.data),
        select: projectSelect,
      });
    } catch (error) {
      rethrowProjectWriteError(error);
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
    if (!client) throw new NotFoundException('Client not found.');
  }
}

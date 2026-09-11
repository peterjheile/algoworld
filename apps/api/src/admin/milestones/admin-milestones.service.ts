import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type DatabaseClient } from '@algoworld/database';

import { DATABASE_CLIENT } from '../../database/database.constants';
import { AdminAccessService } from '../access/admin-access.service';
import {
  createAdminMilestoneSchema,
  updateAdminMilestoneSchema,
  type AdminMilestoneInput,
} from './admin-milestones.schemas';
import type { AdminMilestone } from './admin-milestones.types';

const milestoneSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  targetDate: true,
  completedAt: true,
  displayOrder: true,
  isVisibleToClient: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectMilestoneSelect;

type MilestoneRecord = Prisma.ProjectMilestoneGetPayload<{
  select: typeof milestoneSelect;
}>;

function serializeMilestone(milestone: MilestoneRecord): AdminMilestone {
  return {
    ...milestone,
    targetDate: milestone.targetDate?.toISOString() ?? null,
    completedAt: milestone.completedAt?.toISOString() ?? null,
    createdAt: milestone.createdAt.toISOString(),
    updatedAt: milestone.updatedAt.toISOString(),
  };
}

function toMilestoneData(input: AdminMilestoneInput) {
  const toDate = (value: string | null): Date | null =>
    value === null ? null : new Date(`${value}T00:00:00.000Z`);
  return {
    ...input,
    targetDate: toDate(input.targetDate),
    completedAt: toDate(input.completedAt),
  };
}

function rethrowWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2025' || error.code === 'P2003')
  ) {
    throw new NotFoundException('Project or milestone not found.');
  }
  throw error;
}

@Injectable()
export class AdminMilestonesService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async findForProject(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<AdminMilestone[]> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const milestones = await this.database.projectMilestone.findMany({
      where: { projectId, project: { clientId } },
      select: milestoneSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return milestones.map(serializeMilestone);
  }

  async findOne(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<AdminMilestone> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const milestone = await this.database.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, project: { clientId } },
      select: milestoneSelect,
    });
    if (!milestone) throw new NotFoundException('Milestone not found.');
    return serializeMilestone(milestone);
  }

  async create(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    input: unknown,
  ): Promise<AdminMilestone> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const parsed = createAdminMilestoneSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException({
        message: 'Check the milestone details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    try {
      const milestone = await this.database.projectMilestone.create({
        data: {
          ...toMilestoneData(parsed.data),
          project: { connect: { id: projectId, clientId } },
        },
        select: milestoneSelect,
      });
      return serializeMilestone(milestone);
    } catch (error) {
      rethrowWriteError(error);
    }
  }

  async update(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    milestoneId: string,
    input: unknown,
  ): Promise<AdminMilestone> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const parsed = updateAdminMilestoneSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException({
        message: 'Check the milestone details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    try {
      const milestone = await this.database.projectMilestone.update({
        // Scope the write itself as well as the preceding parent lookup.
        where: { id: milestoneId, projectId, project: { clientId } },
        data: toMilestoneData(parsed.data),
        select: milestoneSelect,
      });
      return serializeMilestone(milestone);
    } catch (error) {
      rethrowWriteError(error);
    }
  }

  private async assertProjectAccess(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<void> {
    await this.adminAccessService.requireAdmin(clerkUserId);
    const project = await this.database.project.findFirst({
      where: { id: projectId, clientId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found.');
  }
}

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
  createAdminProjectUpdateSchema,
  updateAdminProjectUpdateSchema,
  type AdminUpdatePublication,
} from './admin-project-updates.schemas';
import type { AdminProjectUpdate } from './admin-project-updates.types';

const updateSelect = {
  id: true,
  projectId: true,
  authorUserId: true,
  author: { select: { id: true, firstName: true, lastName: true } },
  title: true,
  content: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectUpdateSelect;
type UpdateRecord = Prisma.ProjectUpdateGetPayload<{
  select: typeof updateSelect;
}>;

function serializeUpdate(update: UpdateRecord): AdminProjectUpdate {
  return {
    ...update,
    publishedAt: update.publishedAt?.toISOString() ?? null,
    createdAt: update.createdAt.toISOString(),
    updatedAt: update.updatedAt.toISOString(),
  };
}

function publicationData(publication: AdminUpdatePublication): {
  publishedAt?: Date | null;
} {
  // Omit the column entirely for KEEP, preserving even its sub-minute precision.
  if (publication.mode === 'KEEP') return {};
  if (publication.mode === 'DRAFT') return { publishedAt: null };
  const now = new Date();
  if (publication.mode === 'PUBLISH_NOW') return { publishedAt: now };
  const publishedAt = new Date(publication.publishedAt);
  if (publishedAt.getTime() <= now.getTime()) {
    throw new BadRequestException({
      message: 'Choose a future publication time.',
      fieldErrors: {
        publication: [
          'The scheduled time must be in the future. Choose a later time or Publish now.',
        ],
      },
    });
  }
  return { publishedAt };
}

function rethrowWriteError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2025' || error.code === 'P2003')
  ) {
    throw new NotFoundException(
      'Project, update, or author account no longer exists.',
    );
  }
  throw error;
}

@Injectable()
export class AdminProjectUpdatesService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
    private readonly adminAccessService: AdminAccessService,
  ) {}

  async findForProject(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<AdminProjectUpdate[]> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const updates = await this.database.projectUpdate.findMany({
      where: { projectId, project: { clientId } },
      select: updateSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return updates.map(serializeUpdate);
  }

  async findOne(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    updateId: string,
  ): Promise<AdminProjectUpdate> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const update = await this.database.projectUpdate.findFirst({
      where: { id: updateId, projectId, project: { clientId } },
      select: updateSelect,
    });
    if (!update) throw new NotFoundException('Project update not found.');
    return serializeUpdate(update);
  }

  async create(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    input: unknown,
  ): Promise<AdminProjectUpdate> {
    const authorUserId = await this.assertProjectAccess(
      clerkUserId,
      clientId,
      projectId,
    );
    const parsed = createAdminProjectUpdateSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException({
        message: 'Check the update details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    const { title, content, publication } = parsed.data;
    const publicationFields = publicationData(publication);
    try {
      const update = await this.database.projectUpdate.create({
        data: {
          title,
          content,
          ...publicationFields,
          project: { connect: { id: projectId, clientId } },
          author: { connect: { id: authorUserId } },
        },
        select: updateSelect,
      });
      return serializeUpdate(update);
    } catch (error) {
      rethrowWriteError(error);
    }
  }

  async update(
    clerkUserId: string,
    clientId: string,
    projectId: string,
    updateId: string,
    input: unknown,
  ): Promise<AdminProjectUpdate> {
    await this.assertProjectAccess(clerkUserId, clientId, projectId);
    const parsed = updateAdminProjectUpdateSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException({
        message: 'Check the update details and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    const { title, content, publication } = parsed.data;
    const publicationFields = publicationData(publication);
    try {
      const update = await this.database.projectUpdate.update({
        where: { id: updateId, projectId, project: { clientId } },
        // Original attribution is never changed by an edit, including when the author is null.
        data: { title, content, ...publicationFields },
        select: updateSelect,
      });
      return serializeUpdate(update);
    } catch (error) {
      rethrowWriteError(error);
    }
  }

  private async assertProjectAccess(
    clerkUserId: string,
    clientId: string,
    projectId: string,
  ): Promise<string> {
    const session = await this.adminAccessService.requireAdmin(clerkUserId);
    const project = await this.database.project.findFirst({
      where: { id: projectId, clientId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found.');
    return session.userId;
  }
}

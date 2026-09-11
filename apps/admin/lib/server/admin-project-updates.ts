import 'server-only';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import {
  getPublicationStatus,
  type PublicationStatus,
  type ProjectUpdateFieldErrors,
  type ProjectUpdateFormValues,
} from '@/lib/project-update-form';
import { requestAdmin } from './admin-request';

const adminProjectUpdateSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  authorUserId: z.string().nullable(),
  author: z
    .object({
      id: z.string(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    })
    .nullable(),
  title: z.string(),
  content: z.string(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
type ProjectUpdateResponse = z.infer<typeof adminProjectUpdateSchema>;
export type AdminProjectUpdate = ProjectUpdateResponse & {
  publicationStatus: PublicationStatus;
};

function withPublicationStatus(
  update: ProjectUpdateResponse,
  now: number,
): AdminProjectUpdate {
  return {
    ...update,
    publicationStatus: getPublicationStatus(update.publishedAt, now),
  };
}
const fieldErrorsSchema = z.object({
  title: z.array(z.string()).optional(),
  content: z.array(z.string()).optional(),
  publication: z.array(z.string()).optional(),
});
export class AdminProjectUpdateWriteError extends Error {
  readonly fieldErrors: ProjectUpdateFieldErrors;
  constructor(message: string, fieldErrors: ProjectUpdateFieldErrors = {}) {
    super(message);
    this.name = 'AdminProjectUpdateWriteError';
    this.fieldErrors = fieldErrors;
  }
}

export async function getAdminProjectUpdates(
  clientId: string,
  projectId: string,
): Promise<AdminProjectUpdate[] | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/updates`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load project updates: ${response.status}`);
  const payload: unknown = await response.json();
  const updates = z.array(adminProjectUpdateSchema).parse(payload);
  // One request-time snapshot keeps the whole list consistent at publication boundaries.
  const now = Date.now();
  return updates.map((update) => withPublicationStatus(update, now));
}
export async function getAdminProjectUpdate(
  clientId: string,
  projectId: string,
  updateId: string,
): Promise<AdminProjectUpdate | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/updates/${encodeURIComponent(updateId)}`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load project update: ${response.status}`);
  const payload: unknown = await response.json();
  return withPublicationStatus(
    adminProjectUpdateSchema.parse(payload),
    Date.now(),
  );
}

function publicationPayload(values: ProjectUpdateFormValues): {
  mode: string;
  publishedAt?: string;
} {
  if (values.publicationMode !== 'SCHEDULE')
    return { mode: values.publicationMode };
  const value = values.scheduledFor;
  const date = new Date(`${value}:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    value < '0001-01-01' ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 16) !== value
  ) {
    throw new AdminProjectUpdateWriteError('Check the publication settings.', {
      publication: ['Enter a valid scheduled date and time in UTC.'],
    });
  }
  return { mode: 'SCHEDULE', publishedAt: date.toISOString() };
}

export async function saveAdminProjectUpdate(
  clientId: string,
  projectId: string,
  values: ProjectUpdateFormValues,
  updateId?: string,
): Promise<AdminProjectUpdate> {
  const resource =
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/updates` as const;
  const response = await requestAdmin(
    updateId === undefined
      ? resource
      : `${resource}/${encodeURIComponent(updateId)}`,
    {
      method: updateId === undefined ? 'POST' : 'PUT',
      data: {
        title: values.title,
        content: values.content,
        publication: publicationPayload(values),
      },
    },
  );
  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: fieldErrorsSchema })
        .safeParse(payload);
      throw new AdminProjectUpdateWriteError(
        'Check the update details and try again.',
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 401)
      throw new AdminProjectUpdateWriteError(
        'Your session could not be verified. Sign in again.',
      );
    if (response.status === 403)
      throw new AdminProjectUpdateWriteError(
        'Administrator access is required to manage updates.',
      );
    if (response.status === 404)
      throw new AdminProjectUpdateWriteError(
        'The project, update, or author account no longer exists. Return to the project list.',
      );
    throw new AdminProjectUpdateWriteError(
      'The save could not be confirmed. Refresh the update list before trying again.',
    );
  }
  const payload: unknown = await response.json();
  return withPublicationStatus(
    adminProjectUpdateSchema.parse(payload),
    Date.now(),
  );
}

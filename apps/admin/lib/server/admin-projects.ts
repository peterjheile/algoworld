import 'server-only';

import { notFound } from 'next/navigation';
import { z } from 'zod';

import {
  projectStatuses,
  type ProjectFieldErrors,
  type ProjectFormValues,
} from '@/lib/project-form';
import { requestAdmin } from './admin-request';

const adminProjectSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(projectStatuses),
  startDate: z.string().datetime().nullable(),
  targetEndDate: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  isVisibleToClient: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AdminProject = z.infer<typeof adminProjectSchema>;

const projectFieldErrorsSchema = z.object({
  name: z.array(z.string()).optional(),
  description: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  startDate: z.array(z.string()).optional(),
  targetEndDate: z.array(z.string()).optional(),
  completedAt: z.array(z.string()).optional(),
  isVisibleToClient: z.array(z.string()).optional(),
});

export class AdminProjectWriteError extends Error {
  readonly fieldErrors: ProjectFieldErrors;
  constructor(message: string, fieldErrors: ProjectFieldErrors = {}) {
    super(message);
    this.name = 'AdminProjectWriteError';
    this.fieldErrors = fieldErrors;
  }
}

export async function getAdminProjects(
  clientId: string,
): Promise<AdminProject[] | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load admin projects: ${response.status}`);
  const payload: unknown = await response.json();
  return z.array(adminProjectSchema).parse(payload);
}

export async function getAdminProject(
  clientId: string,
  projectId: string,
): Promise<AdminProject | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load admin project: ${response.status}`);
  const payload: unknown = await response.json();
  return adminProjectSchema.parse(payload);
}

export async function saveAdminProject(
  clientId: string,
  values: ProjectFormValues,
  projectId?: string,
): Promise<AdminProject> {
  const resource = `clients/${encodeURIComponent(clientId)}/projects` as const;
  const response = await requestAdmin(
    projectId === undefined
      ? resource
      : `${resource}/${encodeURIComponent(projectId)}`,
    {
      method: projectId === undefined ? 'POST' : 'PUT',
      data: {
        ...values,
        description: values.description.trim() || null,
        startDate: values.startDate || null,
        targetEndDate: values.targetEndDate || null,
        completedAt: values.completedAt || null,
      },
    },
  );
  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: projectFieldErrorsSchema })
        .safeParse(payload);
      throw new AdminProjectWriteError(
        'Check the project details and try again.',
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 401)
      throw new AdminProjectWriteError(
        'Your session could not be verified. Sign in again.',
      );
    if (response.status === 403)
      throw new AdminProjectWriteError(
        'Administrator access is required to manage projects.',
      );
    if (response.status === 404)
      throw new AdminProjectWriteError(
        'This client or project no longer exists. Return to the client list.',
      );
    throw new AdminProjectWriteError(
      'The save could not be confirmed. Refresh the project list before trying again.',
    );
  }
  const payload: unknown = await response.json();
  return adminProjectSchema.parse(payload);
}

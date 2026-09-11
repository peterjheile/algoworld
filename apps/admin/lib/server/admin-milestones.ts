import 'server-only';

import { notFound } from 'next/navigation';
import { z } from 'zod';

import {
  milestoneStatuses,
  type MilestoneFieldErrors,
  type MilestoneFormValues,
} from '@/lib/milestone-form';
import { requestAdmin } from './admin-request';

const adminMilestoneSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(milestoneStatuses),
  targetDate: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  displayOrder: z.number().int(),
  isVisibleToClient: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AdminMilestone = z.infer<typeof adminMilestoneSchema>;

const milestoneFieldErrorsSchema = z.object({
  title: z.array(z.string()).optional(),
  description: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  targetDate: z.array(z.string()).optional(),
  completedAt: z.array(z.string()).optional(),
  displayOrder: z.array(z.string()).optional(),
  isVisibleToClient: z.array(z.string()).optional(),
});

export class AdminMilestoneWriteError extends Error {
  readonly fieldErrors: MilestoneFieldErrors;
  constructor(message: string, fieldErrors: MilestoneFieldErrors = {}) {
    super(message);
    this.name = 'AdminMilestoneWriteError';
    this.fieldErrors = fieldErrors;
  }
}

export async function getAdminMilestones(
  clientId: string,
  projectId: string,
): Promise<AdminMilestone[] | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/milestones`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load admin milestones: ${response.status}`);
  const payload: unknown = await response.json();
  return z.array(adminMilestoneSchema).parse(payload);
}

export async function getAdminMilestone(
  clientId: string,
  projectId: string,
  milestoneId: string,
): Promise<AdminMilestone | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}`,
  );
  if (response.status === 403) return null;
  if (response.status === 404) notFound();
  if (!response.ok)
    throw new Error(`Unable to load admin milestone: ${response.status}`);
  const payload: unknown = await response.json();
  return adminMilestoneSchema.parse(payload);
}

export async function saveAdminMilestone(
  clientId: string,
  projectId: string,
  values: MilestoneFormValues,
  milestoneId?: string,
): Promise<AdminMilestone> {
  const resource =
    `clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/milestones` as const;
  const response = await requestAdmin(
    milestoneId === undefined
      ? resource
      : `${resource}/${encodeURIComponent(milestoneId)}`,
    {
      method: milestoneId === undefined ? 'POST' : 'PUT',
      data: {
        ...values,
        displayOrder: parseDisplayOrder(values.displayOrder),
        description: values.description.trim() || null,
        targetDate: values.targetDate || null,
        completedAt: values.completedAt || null,
      },
    },
  );
  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: milestoneFieldErrorsSchema })
        .safeParse(payload);
      throw new AdminMilestoneWriteError(
        'Check the milestone details and try again.',
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 401)
      throw new AdminMilestoneWriteError(
        'Your session could not be verified. Sign in again.',
      );
    if (response.status === 403)
      throw new AdminMilestoneWriteError(
        'Administrator access is required to manage milestones.',
      );
    if (response.status === 404)
      throw new AdminMilestoneWriteError(
        'This client, project, or milestone no longer exists. Return to the client list.',
      );
    throw new AdminMilestoneWriteError(
      'The save could not be confirmed. Refresh the milestone list before trying again.',
    );
  }
  const payload: unknown = await response.json();
  return adminMilestoneSchema.parse(payload);
}

// Do not let Number('') silently turn an empty field into zero.
function parseDisplayOrder(value: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new AdminMilestoneWriteError(
      'Check the milestone details and try again.',
      {
        displayOrder: ['Enter a whole number from 0 to 2147483647.'],
      },
    );
  }
  const order = Number(value);
  if (!Number.isSafeInteger(order) || order > 2147483647) {
    throw new AdminMilestoneWriteError(
      'Check the milestone details and try again.',
      {
        displayOrder: ['Enter a whole number from 0 to 2147483647.'],
      },
    );
  }
  return order;
}

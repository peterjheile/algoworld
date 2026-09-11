import 'server-only';

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { requestAdmin } from './admin-request';

import type { ClientFieldErrors, ClientFormValues } from '@/lib/client-form';
import type {
  MembershipFieldErrors,
  MembershipFormValues,
  MembershipRoleValues,
} from '@/lib/membership-form';

const adminSessionSchema = z.object({
  userId: z.string().min(1),
  platformRole: z.literal('ADMIN'),
});

export type AdminSession = z.infer<typeof adminSessionSchema>;

const adminClientSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  projectCount: z.number().int().nonnegative(),
  membershipCount: z.number().int().nonnegative(),
});

const adminClientsSchema = z.array(adminClientSummarySchema);

export type AdminClientSummary = z.infer<typeof adminClientSummarySchema>;

const adminClientDetailSchema = adminClientSummarySchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AdminClientDetail = z.infer<typeof adminClientDetailSchema>;

const adminMembershipUserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  isActive: z.boolean(),
});

const adminMembershipUsersSchema = z.array(adminMembershipUserSchema);

export type AdminMembershipUser = z.infer<typeof adminMembershipUserSchema>;

const adminClientMembershipSchema = z.object({
  clientId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER']),
  user: adminMembershipUserSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const adminClientMembershipsSchema = z.array(adminClientMembershipSchema);

export type AdminClientMembership = z.infer<typeof adminClientMembershipSchema>;

const fieldErrorsSchema = z.object({
  name: z.array(z.string()).optional(),
  slug: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
});

export class AdminWriteError extends Error {
  readonly fieldErrors: ClientFieldErrors;

  constructor(message: string, fieldErrors: ClientFieldErrors = {}) {
    super(message);
    this.name = 'AdminWriteError';
    this.fieldErrors = fieldErrors;
  }
}

const membershipFieldErrorsSchema = z.object({
  userId: z.array(z.string()).optional(),
  role: z.array(z.string()).optional(),
});

export class AdminMembershipWriteError extends Error {
  readonly fieldErrors: MembershipFieldErrors;

  constructor(message: string, fieldErrors: MembershipFieldErrors = {}) {
    super(message);
    this.name = 'AdminMembershipWriteError';
    this.fieldErrors = fieldErrors;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const response = await requestAdmin('session');

  if (response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to verify administrator access: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  return adminSessionSchema.parse(payload);
}

export async function getAdminClients(): Promise<AdminClientSummary[] | null> {
  const response = await requestAdmin('clients');

  if (response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load admin clients: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  return adminClientsSchema.parse(payload);
}

export async function getAdminClient(
  clientId: string,
): Promise<AdminClientDetail | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}`,
  );

  if (response.status === 403) {
    return null;
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(`Unable to load admin client: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return adminClientDetailSchema.parse(payload);
}

export async function getAdminClientMemberships(
  clientId: string,
): Promise<AdminClientMembership[] | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/memberships`,
  );

  if (response.status === 403) {
    return null;
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(`Unable to load admin memberships: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return adminClientMembershipsSchema.parse(payload);
}

export async function getAdminAvailableUsers(
  clientId: string,
  query: string,
): Promise<AdminMembershipUser[] | null> {
  const searchParams = new URLSearchParams({ q: query.trim() });
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/available-users?${searchParams.toString()}`,
  );

  if (response.status === 403) {
    return null;
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(`Unable to search available users: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return adminMembershipUsersSchema.parse(payload);
}

export async function createAdminMembership(
  clientId: string,
  data: MembershipFormValues,
): Promise<AdminClientMembership> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/memberships`,
    { method: 'POST', data },
  );

  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: membershipFieldErrorsSchema })
        .safeParse(payload);

      throw new AdminMembershipWriteError(
        'Check the membership details and try again.',
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 409) {
      throw new AdminMembershipWriteError(
        'This user already belongs to this client.',
        { userId: ['This user already belongs to this client.'] },
      );
    }
    if (response.status === 403) {
      throw new AdminMembershipWriteError(
        'Administrator access is required to assign users.',
      );
    }
    if (response.status === 401) {
      throw new AdminMembershipWriteError(
        'Your session could not be verified. Sign in again.',
      );
    }
    if (response.status === 404) {
      throw new AdminMembershipWriteError(
        'The client or selected user no longer exists. Refresh before trying again.',
      );
    }
    throw new AdminMembershipWriteError(
      'The assignment could not be confirmed. Refresh the membership list before trying again.',
    );
  }

  const payload: unknown = await response.json();
  return adminClientMembershipSchema.parse(payload);
}

async function assertMembershipChangeSucceeded(
  response: Response,
): Promise<void> {
  if (response.ok) return;

  if (response.status === 400) {
    const payload: unknown = await response.json().catch(() => null);
    const parsed = z
      .object({ fieldErrors: membershipFieldErrorsSchema })
      .safeParse(payload);
    throw new AdminMembershipWriteError(
      'Check the membership details and try again.',
      parsed.success ? parsed.data.fieldErrors : {},
    );
  }
  if (response.status === 401) {
    throw new AdminMembershipWriteError(
      'Your session could not be verified. Sign in again.',
    );
  }
  if (response.status === 403) {
    throw new AdminMembershipWriteError(
      'Administrator access is required to manage memberships.',
    );
  }
  if (response.status === 404) {
    throw new AdminMembershipWriteError(
      'This client or membership no longer exists. Refresh the page.',
    );
  }
  throw new AdminMembershipWriteError(
    'The change could not be confirmed. Refresh the membership list before trying again.',
  );
}

export async function updateAdminMembership(
  clientId: string,
  userId: string,
  data: MembershipRoleValues,
): Promise<AdminClientMembership> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/memberships/${encodeURIComponent(userId)}`,
    { method: 'PATCH', data },
  );
  await assertMembershipChangeSucceeded(response);
  const payload: unknown = await response.json();
  return adminClientMembershipSchema.parse(payload);
}

export async function removeAdminMembership(
  clientId: string,
  userId: string,
): Promise<void> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}/memberships/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
  await assertMembershipChangeSucceeded(response);
  if (response.status !== 204) {
    throw new AdminMembershipWriteError(
      'Removal could not be confirmed. Refresh the membership list before trying again.',
    );
  }
  // A successful DELETE has no JSON body to parse.
}

export async function saveAdminClient(
  data: ClientFormValues,
  clientId?: string,
): Promise<AdminClientDetail> {
  const response = await requestAdmin(
    clientId === undefined
      ? 'clients'
      : `clients/${encodeURIComponent(clientId)}`,
    { method: clientId === undefined ? 'POST' : 'PATCH', data },
  );

  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: fieldErrorsSchema })
        .safeParse(payload);
      throw new AdminWriteError(
        'Check the client details and try again.',
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 409) {
      throw new AdminWriteError(
        'That slug is already in use. Choose another one.',
        {
          slug: ['That slug is already in use.'],
        },
      );
    }
    if (response.status === 403) {
      throw new AdminWriteError(
        'Administrator access is required to save changes.',
      );
    }
    if (response.status === 401) {
      throw new AdminWriteError(
        'Your session could not be verified. Sign in again.',
      );
    }
    if (response.status === 404) {
      throw new AdminWriteError(
        'This client no longer exists. Return to the client list.',
      );
    }
    throw new AdminWriteError(
      'The save could not be confirmed. Refresh to check the latest details before trying again.',
    );
  }

  const payload: unknown = await response.json();
  return adminClientDetailSchema.parse(payload);
}

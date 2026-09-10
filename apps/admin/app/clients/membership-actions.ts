'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type {
  MembershipFormState,
  MembershipFormValues,
  MembershipRoleFormState,
  MembershipRemovalState,
} from '@/lib/membership-form';
import {
  AdminMembershipWriteError,
  createAdminMembership,
  updateAdminMembership,
  removeAdminMembership,
  type AdminClientMembership,
} from '@/lib/server/admin';

export async function createMembershipAction(
  clientId: string,
  _previousState: MembershipFormState,
  formData: FormData,
): Promise<MembershipFormState> {
  const readText = (key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  };
  const values: MembershipFormValues = {
    userId: readText('userId'),
    role: readText('role'),
  };
  let membership: AdminClientMembership;

  try {
    // The helper authenticates this request; the API rechecks ADMIN and input.
    membership = await createAdminMembership(clientId, values);
  } catch (error) {
    if (error instanceof AdminMembershipWriteError) {
      return {
        values,
        fieldErrors: error.fieldErrors,
        message: error.message,
      };
    }

    // Preserve authentication redirects and unexpected failures.
    throw error;
  }

  const path = `/clients/${encodeURIComponent(membership.clientId)}`;
  revalidatePath('/clients');
  revalidatePath(path);
  // Redirect throws internally, so keep it outside the catch block.
  redirect(`${path}?memberAdded=1#client-memberships`);
}

export async function updateMembershipAction(
  clientId: string,
  userId: string,
  _previousState: MembershipRoleFormState,
  formData: FormData,
): Promise<MembershipRoleFormState> {
  const role = formData.get('role');
  const values = { role: typeof role === 'string' ? role : '' };

  try {
    await updateAdminMembership(clientId, userId, values);
  } catch (error) {
    if (error instanceof AdminMembershipWriteError) {
      return { values, fieldErrors: error.fieldErrors, message: error.message };
    }
    throw error;
  }

  const path = `/clients/${encodeURIComponent(clientId)}`;
  revalidatePath('/clients');
  revalidatePath(path);
  redirect(`${path}?memberUpdated=1#client-memberships`);
}

export async function removeMembershipAction(
  clientId: string,
  userId: string,
): Promise<MembershipRemovalState> {
  try {
    await removeAdminMembership(clientId, userId);
  } catch (error) {
    if (error instanceof AdminMembershipWriteError) {
      return { message: error.message };
    }
    throw error;
  }

  const path = `/clients/${encodeURIComponent(clientId)}`;
  revalidatePath('/clients');
  revalidatePath(path);
  redirect(`${path}?memberRemoved=1#client-memberships`);
}

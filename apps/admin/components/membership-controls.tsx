'use client';

import { useActionState, useId, useState } from 'react';

import {
  removeMembershipAction,
  updateMembershipAction,
} from '@/app/clients/membership-actions';
import {
  membershipRoleLabels,
  type MembershipRemovalState,
  type MembershipRoleFormState,
} from '@/lib/membership-form';

interface MembershipControlsProps {
  clientId: string;
  userId: string;
  role: keyof typeof membershipRoleLabels;
  userLabel: string;
}

export function MembershipControls({
  clientId,
  userId,
  role,
  userLabel,
}: MembershipControlsProps) {
  const id = useId();
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const initialRoleState: MembershipRoleFormState = {
    values: { role },
    fieldErrors: {},
    message: null,
  };
  const initialRemovalState: MembershipRemovalState = { message: null };
  const [roleState, roleAction, saving] = useActionState(
    updateMembershipAction.bind(null, clientId, userId),
    initialRoleState,
  );
  const [removalState, removalAction, removing] = useActionState(
    removeMembershipAction.bind(null, clientId, userId),
    initialRemovalState,
  );
  const pending = saving || removing;
  const buttonClassName =
    'rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 disabled:cursor-wait disabled:opacity-60';

  return (
    <div className="mt-5 border-t border-zinc-100 pt-5">
      <form action={roleAction} aria-busy={saving} className="space-y-3">
        {roleState.message && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {roleState.message}
          </p>
        )}
        <fieldset
          disabled={pending || confirmRemoval}
          className="min-w-0 space-y-3"
        >
          <legend className="sr-only">
            Change membership role for {userLabel}
          </legend>
          <label htmlFor={`${id}-role`} className="block text-sm font-medium">
            Membership role
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              id={`${id}-role`}
              name="role"
              required
              defaultValue={roleState.values.role}
              aria-invalid={Boolean(roleState.fieldErrors.role?.length)}
              aria-describedby={
                roleState.fieldErrors.role?.length
                  ? `${id}-role-error`
                  : undefined
              }
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              {Object.entries(membershipRoleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || confirmRemoval}
              className={`${buttonClassName} bg-zinc-950 text-white hover:bg-zinc-800`}
            >
              {saving ? 'Saving…' : 'Save role'}
            </button>
          </div>
          {roleState.fieldErrors.role?.length ? (
            <p id={`${id}-role-error`} className="text-sm text-red-700">
              {roleState.fieldErrors.role.join(' ')}
            </p>
          ) : null}
        </fieldset>
      </form>

      <div className="mt-4">
        <button
          type="button"
          disabled={pending}
          aria-expanded={confirmRemoval}
          aria-controls={`${id}-removal`}
          onClick={() => setConfirmRemoval(!confirmRemoval)}
          className="rounded text-sm font-medium text-red-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60"
        >
          {confirmRemoval ? 'Cancel removal' : 'Remove membership'}
        </button>

        <div id={`${id}-removal`} hidden={!confirmRemoval}>
          <form
            action={removalAction}
            aria-busy={removing}
            className="mt-3 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm leading-6 text-red-900 [overflow-wrap:anywhere]">
              Remove {userLabel} from this client? Their user account and other
              memberships will remain. Platform administrators retain access
              through their administrator role.
            </p>
            {removalState.message && (
              <p role="alert" className="text-sm text-red-800">
                {removalState.message}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || !confirmRemoval}
              className={`${buttonClassName} bg-red-700 text-white hover:bg-red-800`}
            >
              {removing ? 'Removing…' : 'Confirm removal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

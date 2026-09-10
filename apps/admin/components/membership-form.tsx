"use client";

import { useActionState, useId } from "react";

import { createMembershipAction } from "@/app/clients/membership-actions";
import {
  membershipRoleLabels,
  type MembershipFormState,
} from "@/lib/membership-form";
import type { AdminMembershipUser } from "@/lib/server/admin";

interface MembershipFormProps {
  clientId: string;
  availableUsers: AdminMembershipUser[];
}

export function MembershipForm({
  clientId,
  availableUsers,
}: MembershipFormProps) {
  const id = useId();
  const action = createMembershipAction.bind(null, clientId);
  const initialState: MembershipFormState = {
    values: { userId: "", role: "MEMBER" },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const hasUsers = availableUsers.length > 0;
  const inputClassName =
    "mt-2 block w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950";

  return (
    <form action={formAction} aria-busy={pending} className="space-y-5">
      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      {!hasUsers && (
        <p className="text-sm text-zinc-600">
          Search for an active user who is not already assigned to this client.
        </p>
      )}

      <fieldset
        disabled={pending || !hasUsers}
        className="min-w-0 space-y-5 disabled:opacity-70"
      >
        <legend className="sr-only">Assign a user to this client</legend>

        <div>
          <label htmlFor={`${id}-user`} className="text-sm font-medium">
            User
          </label>
          <select
            id={`${id}-user`}
            name="userId"
            defaultValue={state.values.userId}
            required
            aria-invalid={Boolean(state.fieldErrors.userId?.length)}
            aria-describedby={
              state.fieldErrors.userId?.length ? `${id}-user-error` : undefined
            }
            className={inputClassName}
          >
            <option value="">Choose a user</option>
            {availableUsers.map((user) => {
              const name = [user.firstName?.trim(), user.lastName?.trim()]
                .filter(Boolean)
                .join(" ");

              return (
                <option key={user.id} value={user.id}>
                  {name ? `${name} (${user.email})` : user.email}
                </option>
              );
            })}
          </select>
          {state.fieldErrors.userId?.length ? (
            <p id={`${id}-user-error`} className="mt-2 text-sm text-red-700">
              {state.fieldErrors.userId.join(" ")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${id}-role`} className="text-sm font-medium">
            Membership role
          </label>
          <select
            id={`${id}-role`}
            name="role"
            defaultValue={state.values.role}
            required
            aria-invalid={Boolean(state.fieldErrors.role?.length)}
            aria-describedby={`${id}-role-help${
              state.fieldErrors.role?.length ? ` ${id}-role-error` : ""
            }`}
            className={inputClassName}
          >
            {Object.entries(membershipRoleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p
            id={`${id}-role-help`}
            className="mt-2 text-sm leading-6 text-zinc-500"
          >
            All three roles currently allow access to this client’s portal. A
            membership does not grant platform administrator access.
          </p>
          {state.fieldErrors.role?.length ? (
            <p id={`${id}-role-error`} className="mt-2 text-sm text-red-700">
              {state.fieldErrors.role.join(" ")}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending || !hasUsers}
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 disabled:cursor-not-allowed"
        >
          {pending ? "Assigning…" : "Assign user"}
        </button>
      </fieldset>
    </form>
  );
}

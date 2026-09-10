"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createClientAction, updateClientAction } from "@/app/clients/actions";
import { clientStatusLabels, type ClientFormState } from "@/lib/client-form";

interface ClientFormProps {
  client?: { id: string; name: string; slug: string; status: string };
}

export function ClientForm({ client }: ClientFormProps) {
  const action = client
    ? updateClientAction.bind(null, client.id)
    : createClientAction;
  const initialState: ClientFormState = {
    values: {
      name: client?.name ?? "",
      slug: client?.slug ?? "",
      status: client?.status ?? "ACTIVE",
    },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const inputClassName =
    "mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950";

  return (
    <form action={formAction} aria-busy={pending} className="space-y-6">
      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        <legend className="sr-only">Client details</legend>
        <div>
          <label htmlFor="client-name" className="text-sm font-medium">
            Client name
          </label>
          <input
            id="client-name"
            name="name"
            defaultValue={state.values.name}
            required
            maxLength={160}
            autoComplete="organization"
            aria-invalid={Boolean(state.fieldErrors.name?.length)}
            aria-describedby={
              state.fieldErrors.name?.length ? "name-error" : undefined
            }
            className={inputClassName}
          />
          {state.fieldErrors.name?.length ? (
            <p id="name-error" className="mt-2 text-sm text-red-700">
              {state.fieldErrors.name.join(" ")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="client-slug" className="text-sm font-medium">
            Slug
          </label>
          <input
            id="client-slug"
            name="slug"
            defaultValue={state.values.slug}
            required
            maxLength={80}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(state.fieldErrors.slug?.length)}
            aria-describedby="slug-help slug-error"
            className={inputClassName}
          />
          <p id="slug-help" className="mt-2 text-sm leading-6 text-zinc-500">
            A unique identifier such as mulier-care. Use letters, numbers, and
            single hyphens between words. Letters are saved in lowercase.
          </p>
          <p id="slug-error" className="mt-2 text-sm text-red-700">
            {state.fieldErrors.slug?.join(" ")}
          </p>
        </div>

        <div>
          <label htmlFor="client-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="client-status"
            name="status"
            defaultValue={state.values.status}
            required
            aria-invalid={Boolean(state.fieldErrors.status?.length)}
            aria-describedby="status-help status-error"
            className={inputClassName}
          >
            {Object.entries(clientStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p id="status-help" className="mt-2 text-sm leading-6 text-zinc-500">
            Status organizes client accounts. It does not change portal
            permissions.
          </p>
          <p id="status-error" className="mt-2 text-sm text-red-700">
            {state.fieldErrors.status?.join(" ")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 disabled:cursor-wait"
          >
            {pending ? "Saving…" : client ? "Save changes" : "Create client"}
          </button>
          <Link
            href="/clients"
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            Cancel
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

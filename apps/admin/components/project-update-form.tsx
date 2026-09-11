'use client';
import Link from 'next/link';
import { useActionState, useId, useState } from 'react';
import {
  createProjectUpdateAction,
  updateProjectUpdateAction,
} from '@/app/clients/[clientId]/projects/[projectId]/updates/actions';
import {
  formatUpdateDate,
  type ProjectUpdateFormState,
} from '@/lib/project-update-form';
import type { AdminProjectUpdate } from '@/lib/server/admin-project-updates';

export function ProjectUpdateForm({
  clientId,
  projectId,
  update,
}: {
  clientId: string;
  projectId: string;
  update?: AdminProjectUpdate;
}) {
  const id = useId();
  const action = update
    ? updateProjectUpdateAction.bind(null, clientId, projectId, update.id)
    : createProjectUpdateAction.bind(null, clientId, projectId);
  const initialState: ProjectUpdateFormState = {
    values: {
      title: update?.title ?? '',
      content: update?.content ?? '',
      publicationMode: update ? 'KEEP' : 'DRAFT',
      scheduledFor: update?.publishedAt?.slice(0, 16) ?? '',
    },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const [mode, setMode] = useState(initialState.values.publicationMode);
  const inputClassName =
    'mt-2 block w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950';
  const error = (field: keyof ProjectUpdateFormState['fieldErrors']) =>
    state.fieldErrors[field]?.length ? (
      <p id={`${id}-${field}-error`} className="mt-2 text-sm text-red-700">
        {state.fieldErrors[field]?.join(' ')}
      </p>
    ) : null;
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
      <fieldset
        disabled={pending}
        className="min-w-0 space-y-6 disabled:opacity-70"
      >
        <legend className="sr-only">Project update details</legend>
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">
            Title
          </label>
          <input
            id={`${id}-title`}
            name="title"
            required
            maxLength={160}
            defaultValue={state.values.title}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.title?.length)}
            aria-describedby={
              state.fieldErrors.title?.length ? `${id}-title-error` : undefined
            }
          />
          {error('title')}
        </div>
        <div>
          <label htmlFor={`${id}-content`} className="text-sm font-medium">
            Message
          </label>
          <textarea
            id={`${id}-content`}
            name="content"
            required
            maxLength={20000}
            rows={10}
            defaultValue={state.values.content}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.content?.length)}
            aria-describedby={`${id}-content-help${state.fieldErrors.content?.length ? ` ${id}-content-error` : ''}`}
          />
          <p id={`${id}-content-help`} className="mt-2 text-sm text-zinc-500">
            Describe the progress, decisions, or next steps you want to share.
            Use plain text and line breaks.
          </p>
          {error('content')}
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <label htmlFor={`${id}-publication`} className="text-sm font-medium">
            Publication
          </label>
          <select
            id={`${id}-publication`}
            name="publicationMode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.publication?.length)}
            aria-describedby={`${id}-publication-help${state.fieldErrors.publication?.length ? ` ${id}-publication-error` : ''}`}
          >
            {update && <option value="KEEP">Keep current publication</option>}
            <option value="DRAFT">Save as draft</option>
            <option value="PUBLISH_NOW">Publish now</option>
            <option value="SCHEDULE">Schedule publication</option>
          </select>
          <div
            id={`${id}-publication-help`}
            className="mt-3 space-y-2 text-sm leading-6 text-zinc-600"
          >
            {mode === 'KEEP' && (
              <p>
                The existing publication date stays unchanged:{' '}
                {formatUpdateDate(update?.publishedAt ?? null)}. Changes to an
                already published message become visible when saved.
              </p>
            )}
            {mode === 'DRAFT' && (
              <p>
                This update stays internal. Saving a published update as a draft
                removes it from the client feed on the next refresh.
              </p>
            )}
            {mode === 'PUBLISH_NOW' && (
              <p>
                Saving sets the publication time to now. Clients can see the
                update when the project is visible. Republishing replaces the
                previous publication date.
              </p>
            )}
            {mode === 'SCHEDULE' && (
              <p>
                Choose a future time in UTC. The update becomes available on the
                next client feed request at or after that time, if the project
                is visible. Rescheduling a published update hides it until then.
              </p>
            )}
          </div>
          <div className={mode === 'SCHEDULE' ? 'mt-4' : 'hidden'}>
            <label
              htmlFor={`${id}-scheduledFor`}
              className="text-sm font-medium"
            >
              Publication date and time (UTC)
            </label>
            <input
              id={`${id}-scheduledFor`}
              name="scheduledFor"
              type="datetime-local"
              step={60}
              min="0001-01-01T00:00"
              max="9999-12-31T23:59"
              required={mode === 'SCHEDULE'}
              disabled={mode !== 'SCHEDULE'}
              defaultValue={state.values.scheduledFor}
              className={inputClassName}
              aria-invalid={Boolean(state.fieldErrors.publication?.length)}
              aria-describedby={`${id}-publication-help${state.fieldErrors.publication?.length ? ` ${id}-publication-error` : ''}`}
            />
          </div>
          {error('publication')}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait"
          >
            {pending
              ? 'Saving…'
              : mode === 'DRAFT'
                ? 'Save draft'
                : mode === 'PUBLISH_NOW'
                  ? 'Publish update'
                  : mode === 'SCHEDULE'
                    ? 'Schedule update'
                    : 'Save changes'}
          </button>
          <Link
            href={`/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/updates`}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            Back to updates
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

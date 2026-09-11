'use client';

import Link from 'next/link';
import { useActionState, useId } from 'react';

import {
  createProjectAction,
  updateProjectAction,
} from '@/app/clients/[clientId]/projects/actions';
import { projectStatusLabels, type ProjectFormState } from '@/lib/project-form';
import type { AdminProject } from '@/lib/server/admin-projects';

interface ProjectFormProps {
  clientId: string;
  project?: AdminProject;
}

const scheduleFields = [
  { name: 'startDate', label: 'Start date' },
  { name: 'targetEndDate', label: 'Target completion' },
  { name: 'completedAt', label: 'Actual completion' },
] as const;

export function ProjectForm({ clientId, project }: ProjectFormProps) {
  const id = useId();
  const action = project
    ? updateProjectAction.bind(null, clientId, project.id)
    : createProjectAction.bind(null, clientId);
  const initialState: ProjectFormState = {
    values: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'PLANNING',
      isVisibleToClient: project?.isVisibleToClient ?? false,
      startDate: project?.startDate?.slice(0, 10) ?? '',
      targetEndDate: project?.targetEndDate?.slice(0, 10) ?? '',
      completedAt: project?.completedAt?.slice(0, 10) ?? '',
    },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const inputClassName =
    'mt-2 block w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950';
  const fieldError = (name: keyof ProjectFormState['values']) =>
    state.fieldErrors[name]?.length ? (
      <p id={`${id}-${name}-error`} className="mt-2 text-sm text-red-700">
        {state.fieldErrors[name]?.join(' ')}
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
        <legend className="sr-only">Project details</legend>
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Project name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            defaultValue={state.values.name}
            required
            maxLength={160}
            aria-invalid={Boolean(state.fieldErrors.name?.length)}
            aria-describedby={
              state.fieldErrors.name?.length ? `${id}-name-error` : undefined
            }
            className={inputClassName}
          />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="text-sm font-medium">
            Description
          </label>
          <textarea
            id={`${id}-description`}
            name="description"
            defaultValue={state.values.description}
            rows={5}
            maxLength={10000}
            aria-invalid={Boolean(state.fieldErrors.description?.length)}
            aria-describedby={`${id}-description-help${state.fieldErrors.description?.length ? ` ${id}-description-error` : ''}`}
            className={inputClassName}
          />
          <p
            id={`${id}-description-help`}
            className="mt-2 text-sm text-zinc-500"
          >
            Clients can read this description when the project is visible.
          </p>
          {fieldError('description')}
        </div>
        <div>
          <label htmlFor={`${id}-status`} className="text-sm font-medium">
            Status
          </label>
          <select
            id={`${id}-status`}
            name="status"
            defaultValue={state.values.status}
            required
            aria-invalid={Boolean(state.fieldErrors.status?.length)}
            aria-describedby={
              state.fieldErrors.status?.length
                ? `${id}-status-error`
                : undefined
            }
            className={inputClassName}
          >
            {Object.entries(projectStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('status')}
        </div>
        <div>
          <div className="grid gap-5 sm:grid-cols-3">
            {scheduleFields.map(({ name, label }) => (
              <div key={name} className="min-w-0">
                <label
                  htmlFor={`${id}-${name}`}
                  className="text-sm font-medium"
                >
                  {label}
                </label>
                <input
                  id={`${id}-${name}`}
                  name={name}
                  type="date"
                  defaultValue={state.values[name]}
                  max="9999-12-31"
                  min="0001-01-01"
                  aria-invalid={Boolean(state.fieldErrors[name]?.length)}
                  aria-describedby={`${id}-schedule-help${state.fieldErrors[name]?.length ? ` ${id}-${name}-error` : ''}`}
                  className={inputClassName}
                />
                {fieldError(name)}
              </div>
            ))}
          </div>
          <p
            id={`${id}-schedule-help`}
            className="mt-3 text-sm leading-6 text-zinc-500"
          >
            Dates are optional. Clear a date to remove it. Changing status does
            not automatically set or clear the actual completion date.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <label
            htmlFor={`${id}-visible`}
            className="flex items-start gap-3 text-sm font-medium"
          >
            <input
              id={`${id}-visible`}
              name="isVisibleToClient"
              type="checkbox"
              defaultChecked={state.values.isVisibleToClient}
              aria-invalid={Boolean(
                state.fieldErrors.isVisibleToClient?.length,
              )}
              aria-describedby={`${id}-visibility-help${state.fieldErrors.isVisibleToClient?.length ? ` ${id}-isVisibleToClient-error` : ''}`}
              className="mt-0.5 size-4 shrink-0 accent-zinc-950"
            />
            Visible to client
          </label>
          <p
            id={`${id}-visibility-help`}
            className="mt-2 text-sm leading-6 text-zinc-500"
          >
            When checked, authorized client users can open this project in the
            portal. Uncheck to keep the project and its timeline and updates
            internal.
          </p>
          {fieldError('isVisibleToClient')}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 disabled:cursor-wait"
          >
            {pending ? 'Saving…' : project ? 'Save project' : 'Create project'}
          </button>
          <Link
            href={`/clients/${encodeURIComponent(clientId)}/projects`}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            Back to projects
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

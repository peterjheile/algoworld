'use client';

import Link from 'next/link';
import { useActionState, useId } from 'react';

import {
  createMilestoneAction,
  updateMilestoneAction,
} from '@/app/clients/[clientId]/projects/[projectId]/milestones/actions';
import {
  milestoneStatusLabels,
  type MilestoneFormState,
} from '@/lib/milestone-form';
import type { AdminMilestone } from '@/lib/server/admin-milestones';

interface MilestoneFormProps {
  clientId: string;
  projectId: string;
  milestone?: AdminMilestone;
}

const scheduleFields = [
  { name: 'targetDate', label: 'Target completion' },
  { name: 'completedAt', label: 'Actual completion' },
] as const;

export function MilestoneForm({
  clientId,
  projectId,
  milestone,
}: MilestoneFormProps) {
  const id = useId();
  const action = milestone
    ? updateMilestoneAction.bind(null, clientId, projectId, milestone.id)
    : createMilestoneAction.bind(null, clientId, projectId);
  const initialState: MilestoneFormState = {
    values: {
      title: milestone?.title ?? '',
      displayOrder: String(milestone?.displayOrder ?? 0),
      description: milestone?.description ?? '',
      status: milestone?.status ?? 'PENDING',
      isVisibleToClient: milestone?.isVisibleToClient ?? false,
      targetDate: milestone?.targetDate?.slice(0, 10) ?? '',
      completedAt: milestone?.completedAt?.slice(0, 10) ?? '',
    },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const inputClassName =
    'mt-2 block w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950';
  const fieldError = (name: keyof MilestoneFormState['values']) =>
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
        <legend className="sr-only">Milestone details</legend>
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">
            Milestone title
          </label>
          <input
            id={`${id}-title`}
            name="title"
            defaultValue={state.values.title}
            required
            maxLength={160}
            aria-invalid={Boolean(state.fieldErrors.title?.length)}
            aria-describedby={
              state.fieldErrors.title?.length ? `${id}-title-error` : undefined
            }
            className={inputClassName}
          />
          {fieldError('title')}
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
            Clients can read this description when both the milestone and its
            project are visible.
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
            {Object.entries(milestoneStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('status')}
        </div>
        <div>
          <div className="grid gap-5 sm:grid-cols-2">
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
        <div>
          <label htmlFor={`${id}-displayOrder`} className="text-sm font-medium">
            Display order
          </label>
          <input
            id={`${id}-displayOrder`}
            name="displayOrder"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            required
            defaultValue={state.values.displayOrder}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.displayOrder?.length)}
            aria-describedby={`${id}-order-help${state.fieldErrors.displayOrder?.length ? ` ${id}-displayOrder-error` : ''}`}
          />
          <p id={`${id}-order-help`} className="mt-2 text-sm text-zinc-500">
            Lower numbers appear first. Use 10, 20, 30 to leave space for later
            steps. Equal numbers are allowed; older milestones appear first.
          </p>
          {fieldError('displayOrder')}
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
            Show this step in the client timeline when its project is also
            visible. Uncheck to keep this milestone internal.
          </p>
          {fieldError('isVisibleToClient')}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 disabled:cursor-wait"
          >
            {pending
              ? 'Saving…'
              : milestone
                ? 'Save milestone'
                : 'Create milestone'}
          </button>
          <Link
            href={`/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/milestones`}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            Back to milestones
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

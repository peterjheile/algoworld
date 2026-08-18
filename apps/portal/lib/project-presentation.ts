import type {
  MilestoneStatus,
  ProjectStatus,
} from '@/lib/server/clients';

export const projectStatusLabels: Record<
  ProjectStatus,
  string
> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In progress',
  WAITING_ON_CLIENT: 'Waiting on client',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const projectStatusStyles: Record<
  ProjectStatus,
  string
> = {
  PLANNING: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700',
  WAITING_ON_CLIENT: 'bg-amber-50 text-amber-700',
  ON_HOLD: 'bg-orange-50 text-orange-700',
  COMPLETED: 'bg-zinc-100 text-zinc-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export const milestoneStatusLabels: Record<
  MilestoneStatus,
  string
> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  WAITING_ON_CLIENT: 'Waiting on client',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
};

export const milestoneStatusStyles: Record<
  MilestoneStatus,
  string
> = {
  PENDING: 'bg-zinc-100 text-zinc-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  WAITING_ON_CLIENT: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  SKIPPED: 'bg-zinc-100 text-zinc-500',
};

export const milestoneDotStyles: Record<
  MilestoneStatus,
  string
> = {
  PENDING: 'bg-zinc-300',
  IN_PROGRESS: 'bg-blue-500',
  WAITING_ON_CLIENT: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  SKIPPED: 'bg-zinc-400',
};

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

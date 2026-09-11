export const projectStatuses = [
  'PLANNING',
  'IN_PROGRESS',
  'WAITING_ON_CLIENT',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;

export type AdminProjectStatus = (typeof projectStatuses)[number];

export interface ProjectFormValues {
  name: string;
  description: string;
  status: string;
  startDate: string;
  targetEndDate: string;
  completedAt: string;
  isVisibleToClient: boolean;
}

export type ProjectFieldErrors = Partial<
  Record<keyof ProjectFormValues, string[]>
>;

export interface ProjectFormState {
  values: ProjectFormValues;
  fieldErrors: ProjectFieldErrors;
  message: string | null;
}

export const projectStatusLabels: Record<AdminProjectStatus, string> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In progress',
  WAITING_ON_CLIENT: 'Waiting on client',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const projectStatusStyles: Record<AdminProjectStatus, string> = {
  PLANNING: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700',
  WAITING_ON_CLIENT: 'bg-amber-50 text-amber-700',
  ON_HOLD: 'bg-orange-50 text-orange-700',
  COMPLETED: 'bg-zinc-100 text-zinc-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export function formatProjectDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    : 'Not scheduled';
}

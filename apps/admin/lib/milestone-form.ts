export const milestoneStatuses = [
  'PENDING',
  'IN_PROGRESS',
  'WAITING_ON_CLIENT',
  'COMPLETED',
  'SKIPPED',
] as const;
export type AdminMilestoneStatus = (typeof milestoneStatuses)[number];
export interface MilestoneFormValues {
  title: string;
  description: string;
  status: string;
  targetDate: string;
  completedAt: string;
  displayOrder: string;
  isVisibleToClient: boolean;
}
export type MilestoneFieldErrors = Partial<
  Record<keyof MilestoneFormValues, string[]>
>;
export interface MilestoneFormState {
  values: MilestoneFormValues;
  fieldErrors: MilestoneFieldErrors;
  message: string | null;
}
export const milestoneStatusLabels: Record<AdminMilestoneStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  WAITING_ON_CLIENT: 'Waiting on client',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
};
export const milestoneStatusStyles: Record<AdminMilestoneStatus, string> = {
  PENDING: 'bg-zinc-100 text-zinc-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  WAITING_ON_CLIENT: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  SKIPPED: 'bg-zinc-100 text-zinc-500',
};

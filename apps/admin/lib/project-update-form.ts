export const publicationModes = [
  'KEEP',
  'DRAFT',
  'PUBLISH_NOW',
  'SCHEDULE',
] as const;
export type PublicationMode = (typeof publicationModes)[number];
export type PublicationStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
export interface ProjectUpdateFormValues {
  title: string;
  content: string;
  publicationMode: string;
  scheduledFor: string;
}
export type ProjectUpdateFieldErrors = Partial<
  Record<'title' | 'content' | 'publication', string[]>
>;
export interface ProjectUpdateFormState {
  values: ProjectUpdateFormValues;
  fieldErrors: ProjectUpdateFieldErrors;
  message: string | null;
}
export function getPublicationStatus(
  publishedAt: string | null,
  now: number,
): PublicationStatus {
  if (publishedAt === null) return 'DRAFT';
  return new Date(publishedAt).getTime() > now ? 'SCHEDULED' : 'PUBLISHED';
}
export const publicationStatusLabels: Record<PublicationStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
};
export const publicationStatusStyles: Record<PublicationStatus, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-700',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-700',
};
export function formatUpdateDate(value: string | null): string {
  if (!value) return 'Not published';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value));
}
export function updateAuthorLabel(
  author: { firstName: string | null; lastName: string | null } | null,
): string {
  if (!author) return 'Author unavailable';
  return (
    [author.firstName, author.lastName].filter(Boolean).join(' ') ||
    'Team member'
  );
}

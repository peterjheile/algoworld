import { z } from 'zod';

// Match a canonical ISO instant, including milliseconds. Calendar validity is checked too.
const publicationDateSchema = z
  .string()
  .datetime({ precision: 3 })
  .refine((value) => {
    const date = new Date(value);
    return (
      value >= '0001-01-01' &&
      Number.isFinite(date.getTime()) &&
      date.toISOString() === value
    );
  }, 'Enter a valid publication date and time in UTC.');

const draft = z.object({ mode: z.literal('DRAFT') }).strict();
const publishNow = z.object({ mode: z.literal('PUBLISH_NOW') }).strict();
const schedule = z
  .object({ mode: z.literal('SCHEDULE'), publishedAt: publicationDateSchema })
  .strict();
const keep = z.object({ mode: z.literal('KEEP') }).strict();
const fields = {
  title: z.string().trim().min(1, 'Enter an update title.').max(160),
  content: z.string().trim().min(1, 'Enter an update message.').max(20000),
};

export const createAdminProjectUpdateSchema = z
  .object({
    ...fields,
    publication: z
      .discriminatedUnion('mode', [draft, publishNow, schedule])
      .default({ mode: 'DRAFT' }),
  })
  .strict();

// Content is replaced, while KEEP explicitly leaves the stored publication instant alone.
export const updateAdminProjectUpdateSchema = z
  .object({
    ...fields,
    publication: z.discriminatedUnion('mode', [
      draft,
      publishNow,
      schedule,
      keep,
    ]),
  })
  .strict();
export type AdminUpdatePublication = z.infer<
  typeof updateAdminProjectUpdateSchema
>['publication'];

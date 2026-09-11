import { ProjectStatus } from '@algoworld/database';
import { z } from 'zod';

// Admin schedules use calendar dates. Store them at midnight UTC.
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Enter a valid calendar date.')
  .nullable();

const projectFields = z
  .object({
    name: z.string().trim().min(1, 'Enter a project name.').max(160),
    description: z
      .string()
      .trim()
      .max(10000)
      .nullable()
      .transform((value) => value || null),
    status: z.enum([
      ProjectStatus.PLANNING,
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.WAITING_ON_CLIENT,
      ProjectStatus.ON_HOLD,
      ProjectStatus.COMPLETED,
      ProjectStatus.CANCELLED,
    ]),
    startDate: calendarDateSchema,
    targetEndDate: calendarDateSchema,
    completedAt: calendarDateSchema,
    isVisibleToClient: z.boolean(),
  })
  .strict();

type Schedule = {
  startDate: string | null;
  targetEndDate: string | null;
  completedAt: string | null;
};

function checkSchedule(data: Schedule, context: z.RefinementCtx): void {
  if (
    data.startDate &&
    data.targetEndDate &&
    data.targetEndDate < data.startDate
  ) {
    context.addIssue({
      code: 'custom',
      path: ['targetEndDate'],
      message: 'Target completion cannot be before the start date.',
    });
  }
  if (data.startDate && data.completedAt && data.completedAt < data.startDate) {
    context.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Completion cannot be before the start date.',
    });
  }
}

export const createAdminProjectSchema = projectFields
  .extend({
    description: projectFields.shape.description.default(null),
    status: projectFields.shape.status.default(ProjectStatus.PLANNING),
    startDate: calendarDateSchema.default(null),
    targetEndDate: calendarDateSchema.default(null),
    completedAt: calendarDateSchema.default(null),
    isVisibleToClient: z.boolean().default(false),
  })
  .strict()
  .superRefine(checkSchedule);

// PUT replaces the complete editable form; immutable fields are not accepted.
export const updateAdminProjectSchema =
  projectFields.superRefine(checkSchedule);

export type AdminProjectInput = z.infer<typeof updateAdminProjectSchema>;

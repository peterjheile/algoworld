import { MilestoneStatus } from '@algoworld/database';
import { z } from 'zod';

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      value >= '0001-01-01' &&
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Enter a valid calendar date.')
  .nullable();

const milestoneFields = z
  .object({
    title: z.string().trim().min(1, 'Enter a milestone title.').max(160),
    description: z
      .string()
      .trim()
      .max(10000)
      .nullable()
      .transform((value) => value || null),
    status: z.enum([
      MilestoneStatus.PENDING,
      MilestoneStatus.IN_PROGRESS,
      MilestoneStatus.WAITING_ON_CLIENT,
      MilestoneStatus.COMPLETED,
      MilestoneStatus.SKIPPED,
    ]),
    targetDate: calendarDateSchema,
    completedAt: calendarDateSchema,
    displayOrder: z.number().int('Use a whole number.').min(0).max(2147483647),
    isVisibleToClient: z.boolean(),
  })
  .strict();

export const createAdminMilestoneSchema = milestoneFields
  .extend({
    description: milestoneFields.shape.description.default(null),
    status: milestoneFields.shape.status.default(MilestoneStatus.PENDING),
    targetDate: calendarDateSchema.default(null),
    completedAt: calendarDateSchema.default(null),
    displayOrder: milestoneFields.shape.displayOrder.default(0),
    isVisibleToClient: z.boolean().default(false),
  })
  .strict();

// PUT supplies every editable field. Route IDs cannot be changed in the body.
export const updateAdminMilestoneSchema = milestoneFields;
export type AdminMilestoneInput = z.infer<typeof updateAdminMilestoneSchema>;

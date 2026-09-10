import { z } from 'zod';

const clientFields = z.object({
  name: z.string().trim().min(1, 'Enter a client name.').max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter a slug.')
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use letters, numbers, and single hyphens between words.',
    ),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
});

export const createAdminClientSchema = clientFields
  .extend({ status: clientFields.shape.status.default('ACTIVE') })
  .strict();

export const updateAdminClientSchema = clientFields
  .partial()
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    'Provide at least one field to update.',
  );

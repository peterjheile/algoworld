import { ClientRole } from '@algoworld/database';
import { z } from 'zod';

const clientRoleSchema = z.enum([
  ClientRole.OWNER,
  ClientRole.MANAGER,
  ClientRole.MEMBER,
]);

export const createAdminMembershipSchema = z
  .object({
    userId: z.string().trim().min(1, 'Choose a user.'),
    role: clientRoleSchema.default(ClientRole.MEMBER),
  })
  .strict();

export const updateAdminMembershipSchema = z
  .object({
    role: clientRoleSchema,
  })
  .strict();

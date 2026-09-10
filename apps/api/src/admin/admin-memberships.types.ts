import type { ClientRole } from '@algoworld/database';

export interface AdminMembershipUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

export interface AdminClientMembership {
  clientId: string;
  userId: string;
  role: ClientRole;
  user: AdminMembershipUser;
  createdAt: Date;
  updatedAt: Date;
}

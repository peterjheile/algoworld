import type { ClientStatus } from '@algoworld/database';

export interface AdminSession {
  userId: string;
  platformRole: 'ADMIN';
}

export interface AdminClientSummary {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  projectCount: number;
  membershipCount: number;
}

export interface AdminClientDetail extends AdminClientSummary {
  createdAt: Date;
  updatedAt: Date;
}

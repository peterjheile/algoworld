import type { MilestoneStatus } from '@algoworld/database';

// These are the serialized API values, not Prisma Date objects.
export interface AdminMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  targetDate: string | null;
  completedAt: string | null;
  displayOrder: number;
  isVisibleToClient: boolean;
  createdAt: string;
  updatedAt: string;
}

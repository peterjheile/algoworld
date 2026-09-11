import type { ProjectStatus } from '@algoworld/database';

export interface AdminProject {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetEndDate: Date | null;
  completedAt: Date | null;
  isVisibleToClient: boolean;
  createdAt: Date;
  updatedAt: Date;
}

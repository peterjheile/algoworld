import type { ProjectStatus } from '@algoworld/database';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetEndDate: Date | null;
  completedAt: Date | null;
}

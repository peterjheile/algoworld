import type { MilestoneStatus, ProjectStatus } from '@algoworld/database';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  targetEndDate: Date | null;
  completedAt: Date | null;
}

export interface MilestoneSummary {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  targetDate: Date | null;
  completedAt: Date | null;
  displayOrder: number;
}

export interface ProjectDetail extends ProjectSummary {
  milestones: MilestoneSummary[];
}

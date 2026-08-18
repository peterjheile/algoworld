export {
  createDatabaseClient,
  type DatabaseClient,
} from './client.js';

export {
  ClientRole,
  ClientStatus,
  PlatformRole,
  Prisma,
  ProjectStatus,
  MilestoneStatus,
  type ProjectMilestone,
  type Client,
  type ClientMembership,
  type Project,
  type User,
} from './generated/prisma/client.js';
import { z } from 'zod';

const clientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const clientsResponseSchema = z.array(clientSummarySchema);

export type ClientSummary = z.infer<typeof clientSummarySchema>;






const projectStatusSchema = z.enum([
  'PLANNING',
  'IN_PROGRESS',
  'WAITING_ON_CLIENT',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]);

const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  startDate: z.string().datetime().nullable(),
  targetEndDate: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
});

const projectsResponseSchema = z.array(projectSummarySchema);

export type ProjectStatus = z.infer<
  typeof projectStatusSchema
>;

export type ProjectSummary = z.infer<
  typeof projectSummarySchema
>;








const milestoneStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'WAITING_ON_CLIENT',
  'COMPLETED',
  'SKIPPED',
]);

const milestoneSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: milestoneStatusSchema,
  targetDate: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  displayOrder: z.number().int(),
});

const projectDetailSchema = projectSummarySchema.extend({
  milestones: z.array(milestoneSummarySchema),
});

export type MilestoneStatus = z.infer<
  typeof milestoneStatusSchema
>;

export type MilestoneSummary = z.infer<
  typeof milestoneSummarySchema
>;

export type ProjectDetail = z.infer<
  typeof projectDetailSchema
>;










function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is not configured.');
  }

  return apiBaseUrl.replace(/\/$/, '');
}

async function requestClients(
  path: string,
  token: string,
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
}

export async function getAccessibleClients(
  token: string,
): Promise<ClientSummary[]> {
  const response = await requestClients(
    '/api/v1/clients',
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load clients: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  return clientsResponseSchema.parse(payload);
}

export async function getAccessibleClient(
  token: string,
  clientId: string,
): Promise<ClientSummary | null> {
  const response = await requestClients(
    `/api/v1/clients/${encodeURIComponent(clientId)}`,
    token,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load client: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  return clientSummarySchema.parse(payload);
}










export async function getVisibleProjects(
  token: string,
  clientId: string,
): Promise<ProjectSummary[]> {
  const response = await requestClients(
    `/api/v1/clients/${encodeURIComponent(clientId)}/projects`,
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load projects: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  return projectsResponseSchema.parse(payload);
}









export async function getVisibleProject(
  token: string,
  clientId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const response = await requestClients(
    `/api/v1/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}`,
    token,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load project: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  return projectDetailSchema.parse(payload);
}








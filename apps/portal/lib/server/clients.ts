import { z } from 'zod';

const clientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const clientsResponseSchema = z.array(clientSummarySchema);

export type ClientSummary = z.infer<typeof clientSummarySchema>;

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

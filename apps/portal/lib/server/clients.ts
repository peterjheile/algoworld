import { z } from 'zod';

const clientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const clientsResponseSchema = z.array(clientSummarySchema);

export type ClientSummary = z.infer<typeof clientSummarySchema>;

export async function getAccessibleClients(
  token: string,
): Promise<ClientSummary[]> {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is not configured.');
  }

  const response = await fetch(
    `${apiBaseUrl}/api/v1/clients`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load clients: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  return clientsResponseSchema.parse(payload);
}


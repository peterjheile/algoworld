import 'server-only';

import { auth } from '@clerk/nextjs/server';

// Transport only. Each caller supplies its typed payload and validates its response.
export async function requestAdmin(
  resource: 'session' | 'clients' | `clients/${string}`,
  write?:
    | { method: 'POST' | 'PUT' | 'PATCH'; data: object }
    | { method: 'DELETE'; data?: never },
): Promise<Response> {
  const authState = await auth.protect();
  const token = await authState.getToken();
  if (!token) throw new Error('Unable to retrieve the Clerk session token.');

  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl)
    throw new Error('API_BASE_URL is not configured for the admin app.');

  return fetch(new URL(`/api/v1/admin/${resource}`, apiBaseUrl), {
    method: write?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(write && write.method !== 'DELETE'
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    ...(write && write.method !== 'DELETE'
      ? { body: JSON.stringify(write.data) }
      : {}),
    cache: 'no-store',
    redirect: 'error',
  });
}

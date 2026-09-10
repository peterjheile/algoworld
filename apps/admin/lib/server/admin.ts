import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import type { ClientFieldErrors, ClientFormValues } from "@/lib/client-form";

const adminSessionSchema = z.object({
  userId: z.string().min(1),
  platformRole: z.literal("ADMIN"),
});

export type AdminSession = z.infer<typeof adminSessionSchema>;

const adminClientSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  slug: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]),
  projectCount: z.number().int().nonnegative(),
  membershipCount: z.number().int().nonnegative(),
});

const adminClientsSchema = z.array(adminClientSummarySchema);

export type AdminClientSummary = z.infer<typeof adminClientSummarySchema>;

const adminClientDetailSchema = adminClientSummarySchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AdminClientDetail = z.infer<typeof adminClientDetailSchema>;

const fieldErrorsSchema = z.object({
  name: z.array(z.string()).optional(),
  slug: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
});

export class AdminWriteError extends Error {
  readonly fieldErrors: ClientFieldErrors;

  constructor(message: string, fieldErrors: ClientFieldErrors = {}) {
    super(message);
    this.name = "AdminWriteError";
    this.fieldErrors = fieldErrors;
  }
}

async function requestAdmin(
  resource: "session" | "clients" | `clients/${string}`,
  write?: { method: "POST" | "PATCH"; data: ClientFormValues },
): Promise<Response> {
  const authState = await auth.protect();
  const token = await authState.getToken();

  if (!token) {
    throw new Error("Unable to retrieve the Clerk session token.");
  }

  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is not configured for the admin app.");
  }

  return fetch(new URL(`/api/v1/admin/${resource}`, apiBaseUrl), {
    method: write?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(write ? { "Content-Type": "application/json" } : {}),
    },
    ...(write ? { body: JSON.stringify(write.data) } : {}),
    cache: "no-store",
    redirect: "error",
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const response = await requestAdmin("session");

  if (response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to verify administrator access: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  return adminSessionSchema.parse(payload);
}

export async function getAdminClients(): Promise<AdminClientSummary[] | null> {
  const response = await requestAdmin("clients");

  if (response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load admin clients: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  return adminClientsSchema.parse(payload);
}

export async function getAdminClient(
  clientId: string,
): Promise<AdminClientDetail | null> {
  const response = await requestAdmin(
    `clients/${encodeURIComponent(clientId)}`,
  );

  if (response.status === 403) {
    return null;
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(`Unable to load admin client: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return adminClientDetailSchema.parse(payload);
}

export async function saveAdminClient(
  data: ClientFormValues,
  clientId?: string,
): Promise<AdminClientDetail> {
  const response = await requestAdmin(
    clientId === undefined
      ? "clients"
      : `clients/${encodeURIComponent(clientId)}`,
    { method: clientId === undefined ? "POST" : "PATCH", data },
  );

  if (!response.ok) {
    if (response.status === 400) {
      const payload: unknown = await response.json().catch(() => null);
      const parsed = z
        .object({ fieldErrors: fieldErrorsSchema })
        .safeParse(payload);
      throw new AdminWriteError(
        "Check the client details and try again.",
        parsed.success ? parsed.data.fieldErrors : {},
      );
    }
    if (response.status === 409) {
      throw new AdminWriteError(
        "That slug is already in use. Choose another one.",
        {
          slug: ["That slug is already in use."],
        },
      );
    }
    if (response.status === 403) {
      throw new AdminWriteError(
        "Administrator access is required to save changes.",
      );
    }
    if (response.status === 401) {
      throw new AdminWriteError(
        "Your session could not be verified. Sign in again.",
      );
    }
    if (response.status === 404) {
      throw new AdminWriteError(
        "This client no longer exists. Return to the client list.",
      );
    }
    throw new AdminWriteError(
      "The save could not be confirmed. Refresh to check the latest details before trying again.",
    );
  }

  const payload: unknown = await response.json();
  return adminClientDetailSchema.parse(payload);
}

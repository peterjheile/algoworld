"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ClientFormState, ClientFormValues } from "@/lib/client-form";
import {
  AdminWriteError,
  saveAdminClient,
  type AdminClientDetail,
} from "@/lib/server/admin";

function readValues(formData: FormData): ClientFormValues {
  const text = (key: string): string => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return { name: text("name"), slug: text("slug"), status: text("status") };
}

async function save(
  formData: FormData,
  clientId?: string,
): Promise<ClientFormState> {
  const values = readValues(formData);
  let client: AdminClientDetail;

  try {
    // This helper authenticates every invocation; the API rechecks ADMIN.
    client = await saveAdminClient(values, clientId);
  } catch (error) {
    if (error instanceof AdminWriteError) {
      return { values, fieldErrors: error.fieldErrors, message: error.message };
    }
    // Preserve Clerk/Next redirects and unexpected failures.
    throw error;
  }

  const path = `/clients/${encodeURIComponent(client.id)}`;
  revalidatePath("/clients");
  revalidatePath(path);
  // Keep redirect outside the catch block because it throws internally.
  redirect(`${path}?${clientId === undefined ? "created" : "saved"}=1`);
}

export async function createClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  return save(formData);
}

export async function updateClientAction(
  clientId: string,
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  return save(formData, clientId);
}

import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessRestricted } from "@/components/access-restricted";
import { ClientForm } from "@/components/client-form";
import { getAdminClient } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Client details" };

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
  }>;
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = await getAdminClient(clientId);
  if (!client) {
    return <AccessRestricted />;
  }
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div className="min-w-0">
            <Link
              href="/clients"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← Clients
            </Link>
            <h1 className="mt-2 break-words text-2xl font-semibold">
              {client.name}
            </h1>
          </div>
          <UserButton />
        </header>
        <section className="py-12">
          {(query.created === "1" || query.saved === "1") && (
            <p
              role="status"
              className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {query.created === "1" ? "Client created." : "Changes saved."}
            </p>
          )}
          <dl className="mb-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Projects</dt>
              <dd className="mt-1 text-xl font-semibold">
                {client.projectCount}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Memberships</dt>
              <dd className="mt-1 text-xl font-semibold">
                {client.membershipCount}
              </dd>
            </div>
          </dl>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Edit client</h2>
            <ClientForm key={client.updatedAt} client={client} />
          </div>
        </section>
      </div>
    </main>
  );
}

import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessRestricted } from "@/components/access-restricted";
import { clientStatusLabels } from "@/lib/client-form";
import { getAdminClients } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  // This endpoint independently enforces ADMIN access, including direct visits.
  const clients = await getAdminClients();

  if (clients === null) {
    return <AccessRestricted />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← Administration
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Clients</h1>
          </div>
          <UserButton />
        </header>

        <section aria-labelledby="client-accounts-heading" className="py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="client-accounts-heading" className="text-xl font-semibold">
              Client accounts
            </h2>
            <Link
              href="/clients/new"
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
            >
              New client
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {clients.length} {clients.length === 1 ? "client" : "clients"}.
            Project totals include internal projects. Membership totals include
            all assigned users.
          </p>

          {clients.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h3 className="font-semibold">No clients yet</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Select New client to create your first client account.
              </p>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Client accounts table"
              tabIndex={0}
              className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
            >
              <table className="w-full min-w-[36rem] text-left text-sm">
                <caption className="sr-only">
                  Client names, statuses, total projects, and total memberships
                </caption>
                <thead className="border-b border-zinc-200 bg-zinc-100">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Client
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-right font-semibold"
                    >
                      Projects
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-right font-semibold"
                    >
                      Memberships
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <th
                        scope="row"
                        className="max-w-sm px-5 py-4 font-medium [overflow-wrap:anywhere]"
                      >
                        <Link
                          href={`/clients/${encodeURIComponent(client.id)}`}
                          className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                        >
                          {client.name}
                        </Link>
                        <p className="mt-1 text-xs font-normal text-zinc-500">
                          {client.slug}
                        </p>
                      </th>
                      <td className="px-5 py-4 text-zinc-600">
                        {clientStatusLabels[client.status]}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums text-zinc-600">
                        {client.projectCount}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums text-zinc-600">
                        {client.membershipCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

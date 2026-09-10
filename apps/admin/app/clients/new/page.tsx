import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessRestricted } from "@/components/access-restricted";
import { ClientForm } from "@/components/client-form";
import { getAdminSession } from "@/lib/server/admin";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  const session = await getAdminSession();
  if (!session) {
    return <AccessRestricted />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div>
            <Link
              href="/clients"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← Clients
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">New client</h1>
          </div>
          <UserButton />
        </header>
        <section className="py-12">
          <p className="mb-6 leading-7 text-zinc-600">
            Create a client account for a business, organization, or individual.
            User access is assigned separately through memberships.
          </p>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <ClientForm />
          </div>
        </section>
      </div>
    </main>
  );
}

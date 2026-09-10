import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { AccessRestricted } from "@/components/access-restricted";
import { getAdminSession } from "@/lib/server/admin";

export default async function AdminHomePage() {
  const session = await getAdminSession();

  if (!session) {
    return <AccessRestricted />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Algoworld Digital
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Administration</h1>
          </div>
          <UserButton />
        </header>
        <section className="py-12">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-600">
            View your client accounts and keep track of their project work.
          </p>
          <Link
            href="/clients"
            className="mt-8 block max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
          >
            <h3 className="text-lg font-semibold">Clients</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Browse client accounts and their project and membership totals.
            </p>
            <span className="mt-4 inline-block text-sm font-medium">
              View clients →
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}

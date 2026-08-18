import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAccessibleClient } from '@/lib/server/clients';

interface ClientPageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function ClientPage({
  params,
}: ClientPageProps) {
  const { clientId } = await params;
  const authState = await auth.protect();

  const token = await authState.getToken();

  if (!token) {
    throw new Error('Unable to retrieve the Clerk session token.');
  }

  const client = await getAccessibleClient(token, clientId);

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-zinc-200 py-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← All clients
            </Link>

            <h1 className="mt-2 text-2xl font-semibold">
              {client.name}
            </h1>
          </div>

          <UserButton />
        </header>

        <section className="py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Client dashboard
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Welcome to your project workspace
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Project progress, updates, documents and invoices will
            appear here.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              'Project timeline',
              'Latest updates',
              'Documents',
            ].map((title) => (
              <div
                key={title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold">{title}</h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Coming next
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

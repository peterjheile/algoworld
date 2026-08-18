import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

import { getAccessibleClients } from '@/lib/server/clients';

export default async function PortalHomePage() {
  const authState = await auth.protect();

  const token = await authState.getToken();

  if (!token) {
    throw new Error('Unable to retrieve the Clerk session token.');
  }

  const clients = await getAccessibleClients(token);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-zinc-200 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Algoworld
            </p>

            <h1 className="text-2xl font-semibold">
              Client Portal
            </h1>
          </div>

          <UserButton />
        </header>

        <section className="py-12">
          <h2 className="text-xl font-semibold">
            Your clients
          </h2>

          {clients.length === 0 ? (
            <p className="mt-3 text-zinc-600">
              No client accounts are assigned to you yet.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold">
                    {client.name}
                  </h3>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
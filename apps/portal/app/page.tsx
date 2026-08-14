import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function PortalHomePage() {
  await auth.protect();

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-zinc-200 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Algoworld
            </p>
            <h1 className="text-2xl font-semibold">Client Portal</h1>
          </div>

          <UserButton />
        </header>

        <section className="py-12">
          <h2 className="text-xl font-semibold">
            Authentication is working
          </h2>

          <p className="mt-2 text-zinc-600">
            You are signed in and can access this protected page.
          </p>
        </section>
      </div>
    </main>
  );
}
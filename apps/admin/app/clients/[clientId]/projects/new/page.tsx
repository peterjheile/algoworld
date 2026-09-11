import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessRestricted } from '@/components/access-restricted';
import { ProjectForm } from '@/components/project-form';
import { getAdminClient } from '@/lib/server/admin';

export const metadata: Metadata = { title: 'Create project' };

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getAdminClient(clientId);
  if (!client) return <AccessRestricted />;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <Link
            href={`/clients/${encodeURIComponent(client.id)}/projects`}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            ← Projects
          </Link>
          <UserButton />
        </header>
        <section className="py-12">
          <p className="break-words text-sm font-medium text-zinc-500">
            {client.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Create project</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Start with an internal project and make it visible when it is ready
            to share.
          </p>
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <ProjectForm clientId={client.id} />
          </div>
        </section>
      </div>
    </main>
  );
}

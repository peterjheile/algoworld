import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessRestricted } from '@/components/access-restricted';
import { ProjectForm } from '@/components/project-form';
import { getAdminClient } from '@/lib/server/admin';
import { getAdminProject } from '@/lib/server/admin-projects';

export const metadata: Metadata = { title: 'Edit project' };

interface ProjectPageProps {
  params: Promise<{ clientId: string; projectId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
  }>;
}

export default async function EditProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { clientId, projectId } = await params;
  const [client, project] = await Promise.all([
    getAdminClient(clientId),
    getAdminProject(clientId, projectId),
  ]);
  if (!client || !project) return <AccessRestricted />;
  const query = await searchParams;

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
          <h1 className="mt-2 break-words text-3xl font-semibold">
            {project.name}
          </h1>
          <p
            className={`mt-3 text-sm font-medium ${project.isVisibleToClient ? 'text-emerald-700' : 'text-amber-700'}`}
          >
            {project.isVisibleToClient
              ? 'Visible to client'
              : 'Internal — hidden from client'}
          </p>
          {(query.created === '1' || query.saved === '1') && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {query.created === '1' ? 'Project created.' : 'Project saved.'}
            </p>
          )}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Edit project</h2>
            <ProjectForm
              key={project.updatedAt}
              clientId={client.id}
              project={project}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

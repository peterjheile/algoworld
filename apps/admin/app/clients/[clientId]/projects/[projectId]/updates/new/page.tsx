import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessRestricted } from '@/components/access-restricted';
import { ProjectUpdateForm } from '@/components/project-update-form';
import { getAdminProject } from '@/lib/server/admin-projects';

export const metadata: Metadata = { title: 'Create project update' };
export default async function NewProjectUpdatePage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  const { clientId, projectId } = await params;
  const project = await getAdminProject(clientId, projectId);
  if (!project) return <AccessRestricted />;
  const updatesPath = `/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/updates`;
  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <Link
            href={updatesPath}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            ← Updates
          </Link>
          <UserButton />
        </header>
        <section className="py-12">
          <p className="break-words text-sm text-zinc-500">{project.name}</p>
          <h1 className="mt-2 text-3xl font-semibold">Create update</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Write a progress report and choose when to share it. Your account is
            recorded as its author.
          </p>
          {!project.isVisibleToClient && (
            <p className="mt-4 text-sm text-amber-800">
              The project is internal, so clients cannot see its updates yet.
            </p>
          )}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <ProjectUpdateForm clientId={clientId} projectId={projectId} />
          </div>
        </section>
      </div>
    </main>
  );
}

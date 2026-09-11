import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessRestricted } from '@/components/access-restricted';
import { ProjectUpdateForm } from '@/components/project-update-form';
import {
  formatUpdateDate,
  publicationStatusLabels,
  publicationStatusStyles,
  updateAuthorLabel,
} from '@/lib/project-update-form';
import { getAdminProject } from '@/lib/server/admin-projects';
import { getAdminProjectUpdate } from '@/lib/server/admin-project-updates';

export const metadata: Metadata = { title: 'Edit project update' };
export default async function EditProjectUpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; projectId: string; updateId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
  }>;
}) {
  const { clientId, projectId, updateId } = await params;
  const [project, update] = await Promise.all([
    getAdminProject(clientId, projectId),
    getAdminProjectUpdate(clientId, projectId, updateId),
  ]);
  if (!project || !update) return <AccessRestricted />;
  const query = await searchParams;
  const status = update.publicationStatus;
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
          <h1 className="mt-2 break-words text-3xl font-semibold">
            {update.title}
          </h1>
          <span
            className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${publicationStatusStyles[status]}`}
          >
            {publicationStatusLabels[status]}
          </span>
          <p className="mt-3 break-words text-sm text-zinc-600">
            Author: {updateAuthorLabel(update.author)} ·{' '}
            {formatUpdateDate(update.publishedAt)}
          </p>
          {!project.isVisibleToClient && (
            <p className="mt-4 text-sm text-amber-800">
              The project is internal, so this update stays hidden from clients.
            </p>
          )}
          {(query.created === '1' || query.saved === '1') && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {query.created === '1' ? 'Update created.' : 'Update saved.'}
            </p>
          )}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Edit update</h2>
            <ProjectUpdateForm
              key={update.updatedAt}
              clientId={clientId}
              projectId={projectId}
              update={update}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

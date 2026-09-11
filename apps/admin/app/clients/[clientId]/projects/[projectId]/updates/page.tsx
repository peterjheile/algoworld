import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessRestricted } from '@/components/access-restricted';
import {
  formatUpdateDate,
  publicationStatusLabels,
  publicationStatusStyles,
  updateAuthorLabel,
} from '@/lib/project-update-form';
import { getAdminProject } from '@/lib/server/admin-projects';
import { getAdminProjectUpdates } from '@/lib/server/admin-project-updates';

export const metadata: Metadata = { title: 'Project updates' };
export default async function ProjectUpdatesPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  const { clientId, projectId } = await params;
  const [project, updates] = await Promise.all([
    getAdminProject(clientId, projectId),
    getAdminProjectUpdates(clientId, projectId),
  ]);
  if (!project || !updates) return <AccessRestricted />;
  const projectPath = `/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}`;
  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <Link
            href={projectPath}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            ← Project details
          </Link>
          <UserButton />
        </header>
        <section className="py-12">
          <p className="break-words text-sm text-zinc-500">{project.name}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold">Project updates</h1>
            <Link
              href={`${projectPath}/updates/new`}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            >
              Create update
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Drafts, scheduled posts, and published updates, newest created
            first. Refresh to see publication status changes.
          </p>
          {!project.isVisibleToClient && (
            <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              This project is internal. Its updates stay hidden from clients,
              including published updates.
            </p>
          )}
          {updates.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h2 className="font-semibold">No updates yet</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Create your first progress report for this project.
              </p>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {updates.map((update) => {
                const status = update.publicationStatus;
                return (
                  <li key={update.id}>
                    <Link
                      href={`${projectPath}/updates/${encodeURIComponent(update.id)}`}
                      className="block min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="min-w-0 break-words text-lg font-semibold">
                          {update.title}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${publicationStatusStyles[status]}`}
                        >
                          {publicationStatusLabels[status]}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 break-words whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                        {update.content}
                      </p>
                      <dl className="mt-4 grid gap-4 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-zinc-500">Author</dt>
                          <dd className="mt-1 break-words">
                            {updateAuthorLabel(update.author)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">
                            {status === 'SCHEDULED'
                              ? 'Scheduled for'
                              : 'Publication'}
                          </dt>
                          <dd className="mt-1">
                            {formatUpdateDate(update.publishedAt)}
                          </dd>
                        </div>
                      </dl>
                      <span className="mt-4 inline-block text-sm font-medium">
                        Edit update →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

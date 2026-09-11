import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessRestricted } from '@/components/access-restricted';
import {
  milestoneStatusLabels,
  milestoneStatusStyles,
} from '@/lib/milestone-form';
import { formatProjectDate } from '@/lib/project-form';
import { getAdminProject } from '@/lib/server/admin-projects';
import { getAdminMilestones } from '@/lib/server/admin-milestones';

export const metadata: Metadata = { title: 'Project milestones' };

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  const { clientId, projectId } = await params;
  const [project, milestones] = await Promise.all([
    getAdminProject(clientId, projectId),
    getAdminMilestones(clientId, projectId),
  ]);
  if (!project || !milestones) return <AccessRestricted />;
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
            <h1 className="text-3xl font-semibold">Milestones</h1>
            <Link
              href={`${projectPath}/milestones/new`}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            >
              Create milestone
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Manage the steps, dates, and visibility of this project timeline.
          </p>
          {!project.isVisibleToClient && (
            <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              This project is internal. Its milestones stay hidden from clients
              even when their visibility is enabled.
            </p>
          )}
          {milestones.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h2 className="font-semibold">No milestones yet</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Create the first step in this project timeline.
              </p>
            </div>
          ) : (
            <ol className="mt-8 space-y-4">
              {milestones.map((milestone) => (
                <li key={milestone.id}>
                  <Link
                    href={`${projectPath}/milestones/${encodeURIComponent(milestone.id)}`}
                    className="block min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="min-w-0 break-words text-lg font-semibold">
                        {milestone.title}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${milestoneStatusStyles[milestone.status]}`}
                      >
                        {milestoneStatusLabels[milestone.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">
                      Order {milestone.displayOrder} ·{' '}
                      {milestone.isVisibleToClient
                        ? project.isVisibleToClient
                          ? 'Visible to client'
                          : 'Visibility enabled · project hidden'
                        : 'Internal · hidden from client'}
                    </p>
                    {milestone.description && (
                      <p className="mt-3 line-clamp-3 break-words whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                        {milestone.description}
                      </p>
                    )}
                    <dl className="mt-4 grid gap-4 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-zinc-500">Target</dt>
                        <dd className="mt-1">
                          {formatProjectDate(milestone.targetDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">Actual completion</dt>
                        <dd className="mt-1">
                          {milestone.completedAt
                            ? formatProjectDate(milestone.completedAt)
                            : 'Not recorded'}
                        </dd>
                      </div>
                    </dl>
                    <span className="mt-4 inline-block text-sm font-medium">
                      Edit milestone →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

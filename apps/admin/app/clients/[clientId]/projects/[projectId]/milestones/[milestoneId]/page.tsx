import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessRestricted } from '@/components/access-restricted';
import { MilestoneForm } from '@/components/milestone-form';
import { getAdminProject } from '@/lib/server/admin-projects';
import { getAdminMilestone } from '@/lib/server/admin-milestones';

export const metadata: Metadata = { title: 'Edit milestone' };
export default async function EditMilestonePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; projectId: string; milestoneId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
  }>;
}) {
  const { clientId, projectId, milestoneId } = await params;
  const [project, milestone] = await Promise.all([
    getAdminProject(clientId, projectId),
    getAdminMilestone(clientId, projectId, milestoneId),
  ]);
  if (!project || !milestone) return <AccessRestricted />;
  const query = await searchParams;
  const milestonesPath = `/clients/${encodeURIComponent(clientId)}/projects/${encodeURIComponent(projectId)}/milestones`;
  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <Link
            href={milestonesPath}
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            ← Milestones
          </Link>
          <UserButton />
        </header>
        <section className="py-12">
          <p className="break-words text-sm text-zinc-500">{project.name}</p>
          <h1 className="mt-2 break-words text-3xl font-semibold">
            {milestone.title}
          </h1>
          {!project.isVisibleToClient && (
            <p className="mt-4 text-sm text-amber-800">
              The project is internal, so this milestone stays hidden from
              clients.
            </p>
          )}
          {(query.created === '1' || query.saved === '1') && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {query.created === '1'
                ? 'Milestone created.'
                : 'Milestone saved.'}
            </p>
          )}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Edit milestone</h2>
            <MilestoneForm
              key={milestone.updatedAt}
              clientId={clientId}
              projectId={projectId}
              milestone={milestone}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

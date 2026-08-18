import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  formatDate,
  milestoneDotStyles,
  milestoneStatusLabels,
  milestoneStatusStyles,
  projectStatusLabels,
  projectStatusStyles,
} from '@/lib/project-presentation';
import { getVisibleProject } from '@/lib/server/clients';

interface ProjectPageProps {
  params: Promise<{
    clientId: string;
    projectId: string;
  }>;
}

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { clientId, projectId } = await params;
  const authState = await auth.protect();

  const token = await authState.getToken();

  if (!token) {
    throw new Error('Unable to retrieve the Clerk session token.');
  }

  const project = await getVisibleProject(
    token,
    clientId,
    projectId,
  );

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-zinc-200 py-4">
          <Link
            href={`/clients/${clientId}`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            ← Client dashboard
          </Link>

          <UserButton />
        </header>

        <section className="py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                Project
              </p>

              <h1 className="mt-2 text-3xl font-semibold">
                {project.name}
              </h1>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${projectStatusStyles[project.status]}`}
            >
              {projectStatusLabels[project.status]}
            </span>
          </div>

          {project.description && (
            <p className="mt-5 max-w-2xl leading-7 text-zinc-600">
              {project.description}
            </p>
          )}

          <dl className="mt-8 grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-zinc-500">Started</dt>
              <dd className="mt-1 font-medium">
                {formatDate(project.startDate)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">
                Target completion
              </dt>
              <dd className="mt-1 font-medium">
                {formatDate(project.targetEndDate)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Completed</dt>
              <dd className="mt-1 font-medium">
                {project.completedAt
                  ? formatDate(project.completedAt)
                  : 'Not completed'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="pb-16">
          <h2 className="text-2xl font-semibold">
            Project timeline
          </h2>

          <p className="mt-2 text-zinc-600">
            Follow each major step from planning through completion.
          </p>

          {project.milestones.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h3 className="font-semibold">
                No timeline milestones yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Timeline details will appear here when they are
                ready to share.
              </p>
            </div>
          ) : (
            <ol className="mt-8">
              {project.milestones.map((milestone, index) => (
                <li
                  key={milestone.id}
                  className="grid grid-cols-[1.5rem_1fr] gap-4"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 size-3 shrink-0 rounded-full ${milestoneDotStyles[milestone.status]}`}
                    />

                    {index < project.milestones.length - 1 && (
                      <span className="my-2 w-px flex-1 bg-zinc-200" />
                    )}
                  </div>

                  <article className="pb-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-semibold">
                        {milestone.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${milestoneStatusStyles[milestone.status]}`}
                      >
                        {milestoneStatusLabels[milestone.status]}
                      </span>
                    </div>

                    {milestone.description && (
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {milestone.description}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-zinc-500">
                      Target: {formatDate(milestone.targetDate)}
                    </p>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

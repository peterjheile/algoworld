import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  formatDate,
  projectStatusLabels,
  projectStatusStyles,
} from '@/lib/project-presentation';
import {
  getAccessibleClient,
  getLatestClientProjectUpdates,
  getVisibleProjects,
} from '@/lib/server/clients';

interface ClientPageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function ClientPage({
  params,
}: ClientPageProps) {
  const { clientId } = await params;
  const authState = await auth.protect();
  const token = await authState.getToken();

  if (!token) {
    throw new Error('Unable to retrieve the Clerk session token.');
  }

  const client = await getAccessibleClient(token, clientId);

  if (!client) {
    notFound();
  }

  const [projects, updates] = await Promise.all([
    getVisibleProjects(token, clientId),
    getLatestClientProjectUpdates(token, clientId),
  ]);

  if (updates === null) {
    notFound();
  }

  const clientPath = `/clients/${encodeURIComponent(clientId)}`;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← All clients
            </Link>

            <h1 className="mt-2 break-words text-2xl font-semibold">
              {client.name}
            </h1>
          </div>

          <UserButton />
        </header>

        <section
          aria-labelledby="projects-heading"
          className="py-12"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Client dashboard
          </p>

          <h2
            id="projects-heading"
            className="mt-2 text-2xl font-semibold"
          >
            Projects
          </h2>

          <p className="mt-3 text-zinc-600">
            Follow the current status and expected schedule of your
            projects.
          </p>

          {projects.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h3 className="font-semibold">
                No visible projects yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Projects will appear here when they are ready to
                share.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`${clientPath}/projects/${encodeURIComponent(project.id)}`}
                  className="block min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                >
                  <article className="h-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-400">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-lg font-semibold">
                        {project.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${projectStatusStyles[project.status]}`}
                      >
                        {projectStatusLabels[project.status]}
                      </span>
                    </div>

                    {project.description && (
                      <p className="mt-3 break-words text-sm leading-6 text-zinc-600">
                        {project.description}
                      </p>
                    )}

                    <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm">
                      <div>
                        <dt className="text-zinc-500">
                          Started
                        </dt>
                        <dd className="mt-1 font-medium">
                          {formatDate(project.startDate)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-zinc-500">
                          Target completion
                        </dt>
                        <dd className="mt-1 font-medium">
                          {formatDate(project.targetEndDate)}
                        </dd>
                      </div>
                    </dl>

                    <span className="mt-5 inline-block text-sm font-medium text-zinc-600">
                      View project timeline →
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="grid items-start gap-6 pb-12 lg:grid-cols-3">
          <section
            aria-labelledby="latest-updates-heading"
            className="min-w-0 lg:col-span-2"
          >
            <h2
              id="latest-updates-heading"
              className="text-xl font-semibold"
            >
              Latest updates
            </h2>

            <p className="mt-2 text-sm text-zinc-600">
              Recent news from across your projects.
            </p>

            {updates.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-white p-6">
                <h3 className="font-semibold">
                  No updates yet
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Project updates will appear here when they are
                  ready to share.
                </p>
              </div>
            ) : (
              <ol className="mt-5 space-y-4">
                {updates.map((update) => {
                  const projectPath =
                    `${clientPath}/projects/` +
                    encodeURIComponent(update.project.id);

                  return (
                    <li key={update.id}>
                      <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <header className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            href={projectPath}
                            className="min-w-0 break-words rounded-sm text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                          >
                            {update.project.name}
                          </Link>

                          <time
                            dateTime={update.publishedAt}
                            className="shrink-0 text-xs text-zinc-500"
                          >
                            {formatDate(update.publishedAt)}
                          </time>
                        </header>

                        <h3 className="mt-3 break-words font-semibold">
                          {update.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
                          {update.content}
                        </p>

                        <Link
                          href={`${projectPath}#update-${encodeURIComponent(update.id)}`}
                          aria-label={`Read update: ${update.title}`}
                          className="mt-4 inline-block rounded-sm text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                        >
                          Read update →
                        </Link>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section
            aria-labelledby="documents-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2
              id="documents-heading"
              className="font-semibold"
            >
              Documents
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Coming next
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getAccessibleClient,
  getVisibleProjects,
  // type ProjectStatus,
} from '@/lib/server/clients';

import {
  formatDate,
  projectStatusLabels,
  projectStatusStyles,
} from '@/lib/project-presentation';

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

  const projects = await getVisibleProjects(token, clientId);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-zinc-200 py-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← All clients
            </Link>

            <h1 className="mt-2 text-2xl font-semibold">
              {client.name}
            </h1>
          </div>

          <UserButton />
        </header>

        <section className="py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Client dashboard
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
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
                  href={`/clients/${clientId}/projects/${project.id}`}
                  className="block"
                  key={project.id}
                >
                <article
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">
                      {project.name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${projectStatusStyles[project.status]}`}
                    >
                      {projectStatusLabels[project.status]}
                    </span>
                  </div>

                  {project.description && (
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      {project.description}
                    </p>
                  )}

                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm">
                    <div>
                      <dt className="text-zinc-500">Started</dt>
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
                </article>

                  <span className="mt-5 inline-block text-sm font-medium text-zinc-600">
                    View project timeline →
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {['Latest updates', 'Documents'].map((title) => (
              <div
                key={title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Coming next
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

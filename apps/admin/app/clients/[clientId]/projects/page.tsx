import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessRestricted } from '@/components/access-restricted';
import {
  formatProjectDate,
  projectStatusLabels,
  projectStatusStyles,
} from '@/lib/project-form';
import { getAdminClient } from '@/lib/server/admin';
import { getAdminProjects } from '@/lib/server/admin-projects';

export const metadata: Metadata = { title: 'Client projects' };

export default async function ClientProjectsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const [client, projects] = await Promise.all([
    getAdminClient(clientId),
    getAdminProjects(clientId),
  ]);
  if (!client || projects === null) return <AccessRestricted />;
  const clientPath = `/clients/${encodeURIComponent(client.id)}`;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <Link
            href={clientPath}
            className="min-w-0 text-sm font-medium text-zinc-600 hover:underline"
          >
            ← Client details
          </Link>
          <UserButton />
        </header>
        <section className="py-12">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-zinc-500">
                {client.name}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Projects</h1>
              <p className="mt-3 text-sm text-zinc-600">
                Manage project details, schedules, and client visibility.
              </p>
            </div>
            <Link
              href={`${clientPath}/projects/new`}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
            >
              Create project
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8">
              <h2 className="font-semibold">No projects yet</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Create a project to start organizing work for this client.
              </p>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id} className="min-w-0">
                  <Link
                    href={`${clientPath}/projects/${encodeURIComponent(project.id)}`}
                    className="block h-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="min-w-0 break-words text-lg font-semibold">
                        {project.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${projectStatusStyles[project.status]}`}
                      >
                        {projectStatusLabels[project.status]}
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm font-medium ${project.isVisibleToClient ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {project.isVisibleToClient
                        ? 'Visible to client'
                        : 'Internal — hidden from client'}
                    </p>
                    {project.description && (
                      <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-zinc-600">
                        {project.description}
                      </p>
                    )}
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm">
                      <div>
                        <dt className="text-zinc-500">Start date</dt>
                        <dd className="mt-1 font-medium">
                          {formatProjectDate(project.startDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">Target completion</dt>
                        <dd className="mt-1 font-medium">
                          {formatProjectDate(project.targetEndDate)}
                        </dd>
                      </div>
                    </dl>
                    <span className="mt-5 inline-block text-sm font-medium text-zinc-600">
                      Edit project →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

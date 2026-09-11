import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Project unavailable</h1>
        <p className="mt-4 text-zinc-600">
          The client or project could not be found.
        </p>
        <Link
          href="/clients"
          className="mt-6 inline-block rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Return to clients
        </Link>
      </div>
    </main>
  );
}

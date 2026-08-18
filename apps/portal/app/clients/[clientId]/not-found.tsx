import Link from 'next/link';

export default function ClientNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Client unavailable
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Client not found
        </h1>

        <p className="mt-4 text-zinc-600">
          This client does not exist or you do not have permission
          to access it.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Return to your clients
        </Link>
      </div>
    </main>
  );
}

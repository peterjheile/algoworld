"use client";

import Link from "next/link";

export default function ClientError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">
          Unable to complete the request
        </h1>
        <p className="mt-4 leading-7 text-zinc-600">
          We could not load or confirm the latest client details. If you were
          saving changes, check the client list before submitting again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
          >
            Reload page
          </button>
          <Link
            href="/clients"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
          >
            Client list
          </Link>
        </div>
      </div>
    </main>
  );
}

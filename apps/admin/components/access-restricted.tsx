import { UserButton } from "@clerk/nextjs";

export function AccessRestricted() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-zinc-500">Algoworld Digital</p>
          <UserButton />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Access restricted</h1>
        <p className="mt-3 leading-7 text-zinc-600">
          This account does not have access to Algoworld administration.
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Use the account menu above to sign out and choose another account.
        </p>
      </div>
    </main>
  );
}

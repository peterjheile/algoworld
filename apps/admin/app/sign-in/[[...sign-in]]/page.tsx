import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Algoworld Digital
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1>
        </div>
        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}

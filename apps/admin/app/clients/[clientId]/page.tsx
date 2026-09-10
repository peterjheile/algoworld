import { UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessRestricted } from '@/components/access-restricted';
import { ClientForm } from '@/components/client-form';
import { MembershipForm } from '@/components/membership-form';
import { MembershipControls } from '@/components/membership-controls';
import { membershipRoleLabels } from '@/lib/membership-form';
import {
  getAdminAvailableUsers,
  getAdminClient,
  getAdminClientMemberships,
  type AdminMembershipUser,
} from '@/lib/server/admin';

export const metadata: Metadata = { title: 'Client details' };

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    saved?: string | string[];
    memberAdded?: string | string[];
    memberUpdated?: string | string[];
    memberRemoved?: string | string[];
    q?: string | string[];
  }>;
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const [client, memberships] = await Promise.all([
    getAdminClient(clientId),
    getAdminClientMemberships(clientId),
  ]);

  if (!client || memberships === null) {
    return <AccessRestricted />;
  }
  const query = await searchParams;
  const membershipMessage =
    query.memberRemoved === '1'
      ? 'Membership removed.'
      : query.memberUpdated === '1'
        ? 'Membership role updated.'
        : query.memberAdded === '1'
          ? 'User assigned to this client.'
          : null;
  const clientPath = `/clients/${encodeURIComponent(client.id)}`;
  const searchTerm = typeof query.q === 'string' ? query.q.trim() : '';
  const hasSearch = query.q !== undefined;
  let searchError: string | null = null;

  if (Array.isArray(query.q)) {
    searchError = 'Enter one search term.';
  } else if (hasSearch && (searchTerm.length < 2 || searchTerm.length > 100)) {
    searchError = 'Enter between 2 and 100 characters.';
  }

  let availableUsers: AdminMembershipUser[] = [];

  if (hasSearch && !searchError) {
    const users = await getAdminAvailableUsers(client.id, searchTerm);

    if (users === null) {
      return <AccessRestricted />;
    }

    availableUsers = users;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
          <div className="min-w-0">
            <Link
              href="/clients"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              ← Clients
            </Link>
            <h1 className="mt-2 break-words text-2xl font-semibold">
              {client.name}
            </h1>
          </div>
          <UserButton />
        </header>
        <section className="py-12">
          {(query.created === '1' || query.saved === '1') && (
            <p
              role="status"
              className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {query.created === '1' ? 'Client created.' : 'Changes saved.'}
            </p>
          )}
          <dl className="mb-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Projects</dt>
              <dd className="mt-1 text-xl font-semibold">
                {client.projectCount}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Memberships</dt>
              <dd className="mt-1 text-xl font-semibold">
                {memberships.length}
              </dd>
            </div>
          </dl>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold">Edit client</h2>
            <ClientForm key={client.updatedAt} client={client} />
          </div>
        </section>

        <section
          id="client-memberships"
          aria-labelledby="client-memberships-heading"
          className="border-t border-zinc-200 py-12"
        >
          <h2 id="client-memberships-heading" className="text-xl font-semibold">
            Client memberships
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            People assigned to this client and their membership roles. All three
            roles currently grant the same portal read access.
          </p>

          {membershipMessage && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {membershipMessage}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h3 className="text-lg font-semibold">Assign a user</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Find an existing active user by name or email. Users already
              assigned to this client are excluded.
            </p>

            <form
              action={`${clientPath}#client-memberships`}
              method="get"
              className="mt-5 space-y-3"
            >
              <div>
                <label
                  htmlFor="membership-search"
                  className="text-sm font-medium"
                >
                  Name or email
                </label>
                <input
                  key={searchTerm}
                  id="membership-search"
                  name="q"
                  type="search"
                  defaultValue={searchTerm}
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete="off"
                  aria-invalid={Boolean(searchError)}
                  aria-describedby={`membership-search-help${searchError ? ' membership-search-error' : ''}`}
                  className="mt-2 block w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
                <p
                  id="membership-search-help"
                  className="mt-2 text-sm text-zinc-500"
                >
                  Enter 2–100 characters. Up to 20 matches are shown.
                </p>
                {searchError && (
                  <p
                    id="membership-search-error"
                    role="alert"
                    className="mt-2 text-sm text-red-700"
                  >
                    {searchError}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
                >
                  Search users
                </button>
                {hasSearch && (
                  <Link
                    href={`${clientPath}#client-memberships`}
                    className="text-sm font-medium text-zinc-600 hover:underline"
                  >
                    Clear search
                  </Link>
                )}
              </div>
            </form>

            {hasSearch && !searchError && (
              <div className="mt-6 border-t border-zinc-200 pt-6">
                {availableUsers.length === 0 ? (
                  <p role="status" className="text-sm text-zinc-600">
                    No available users match this search. Try another name or
                    email.
                  </p>
                ) : (
                  <>
                    <p role="status" className="mb-4 text-sm text-zinc-600">
                      {availableUsers.length === 20
                        ? 'Showing up to 20 matches. Refine your search if needed.'
                        : `${availableUsers.length} matching ${availableUsers.length === 1 ? 'user' : 'users'}.`}
                    </p>
                    <MembershipForm
                      key={`${client.id}:${searchTerm}`}
                      clientId={client.id}
                      availableUsers={availableUsers}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {memberships.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-6">
              <h3 className="font-semibold">No memberships yet</h3>
              <p className="mt-2 text-sm text-zinc-500">
                No users have been assigned to this client.
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {memberships.map((membership) => {
                const name = [
                  membership.user.firstName?.trim(),
                  membership.user.lastName?.trim(),
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <li
                    key={membership.userId}
                    className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold [overflow-wrap:anywhere]">
                          {name || membership.user.email}
                        </h3>
                        {name && (
                          <p className="mt-1 text-sm text-zinc-600 [overflow-wrap:anywhere]">
                            {membership.user.email}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {membershipRoleLabels[membership.role]}
                      </span>
                    </div>
                    <p
                      className={`mt-3 text-sm ${membership.user.isActive ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {membership.user.isActive
                        ? 'Account active'
                        : 'Account inactive'}
                    </p>
                    <MembershipControls
                      key={`${membership.userId}:${membership.updatedAt}:${membership.role}`}
                      clientId={client.id}
                      userId={membership.userId}
                      role={membership.role}
                      userLabel={
                        name
                          ? `${name} (${membership.user.email})`
                          : membership.user.email
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

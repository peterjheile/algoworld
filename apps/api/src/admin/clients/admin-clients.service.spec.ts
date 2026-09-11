import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ClientStatus, Prisma, type DatabaseClient } from '@algoworld/database';

import type { AdminAccessService } from '../access/admin-access.service';
import { AdminClientsService } from './admin-clients.service';
import type { AdminSession } from '../admin.types';

interface ClientCountRow {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  _count: { projects: number; memberships: number };
}

interface ClientDetailRow extends ClientCountRow {
  createdAt: Date;
  updatedAt: Date;
}

describe('AdminClientsService', () => {
  const requireAdmin = jest.fn<Promise<AdminSession>, [clerkUserId: string]>();
  const findMany = jest.fn<Promise<ClientCountRow[]>, [args: unknown]>();
  const findUnique = jest.fn<
    Promise<ClientDetailRow | null>,
    [args: unknown]
  >();
  const createRecord = jest.fn<Promise<ClientDetailRow>, [args: unknown]>();
  const updateRecord = jest.fn<Promise<ClientDetailRow>, [args: unknown]>();
  const database = {
    client: {
      findMany,
      findUnique,
      create: createRecord,
      update: updateRecord,
    },
  } as unknown as DatabaseClient;
  const adminAccessService = { requireAdmin } as unknown as AdminAccessService;
  const service = new AdminClientsService(database, adminAccessService);

  const row: ClientDetailRow = {
    id: 'client-1',
    name: 'Mulier Care',
    slug: 'mulier-care',
    status: ClientStatus.ACTIVE,
    createdAt: new Date('2026-09-10T12:00:00.000Z'),
    updatedAt: new Date('2026-09-10T12:00:00.000Z'),
    _count: { projects: 3, memberships: 2 },
  };
  const detail = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectCount: 3,
    membershipCount: 2,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdmin.mockResolvedValue({
      userId: 'local-admin-1',
      platformRole: 'ADMIN',
    });
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(row);
    createRecord.mockResolvedValue(row);
    updateRecord.mockResolvedValue(row);
  });

  it('returns client summaries with counts, slug, and status', async () => {
    findMany.mockResolvedValue([
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        _count: row._count,
      },
    ]);
    await expect(service.findAll('clerk-admin-1')).resolves.toEqual([
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        projectCount: 3,
        membershipCount: 2,
      },
    ]);
    expect(requireAdmin).toHaveBeenCalledWith('clerk-admin-1');
    // Query contract only: this mock does not execute database counts.
    expect(findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: { select: { projects: true, memberships: true } },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  });

  it('returns an empty list when no clients exist', async () => {
    await expect(service.findAll('clerk-admin-1')).resolves.toEqual([]);
  });

  it('loads a client by its stable ID', async () => {
    await expect(service.findOne('clerk-admin-1', row.id)).resolves.toEqual(
      detail,
    );
    expect(findUnique.mock.calls[0]?.[0]).toMatchObject({
      where: { id: row.id },
    });
  });

  it('returns 404 when the client is missing', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findOne('clerk-admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each([
    { label: 'list', run: () => service.findAll('clerk-user-1') },
    { label: 'detail', run: () => service.findOne('clerk-user-1', row.id) },
    {
      label: 'create',
      run: () =>
        service.create('clerk-user-1', { name: row.name, slug: row.slug }),
    },
    {
      label: 'update',
      run: () => service.update('clerk-user-1', row.id, { name: 'Changed' }),
    },
  ])(
    'blocks $label before any database operation when admin access is denied',
    async ({ run }) => {
      const error = new ForbiddenException('Administrator access is required.');
      requireAdmin.mockRejectedValue(error);
      await expect(run()).rejects.toBe(error);
      expect(requireAdmin).toHaveBeenCalledWith('clerk-user-1');
      expect(findMany).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
      expect(createRecord).not.toHaveBeenCalled();
      expect(updateRecord).not.toHaveBeenCalled();
    },
  );

  it('trims inputs, lowercases the slug, and defaults new clients to ACTIVE', async () => {
    await expect(
      service.create('clerk-admin-1', {
        name: '  Mulier Care  ',
        slug: '  MULIER-CARE  ',
      }),
    ).resolves.toEqual(detail);
    expect(createRecord.mock.calls[0]?.[0]).toMatchObject({
      data: {
        name: 'Mulier Care',
        slug: 'mulier-care',
        status: ClientStatus.ACTIVE,
      },
    });
  });

  it.each<{ label: string; input: unknown }>([
    { label: 'blank name', input: { name: '   ', slug: 'valid' } },
    { label: 'long name', input: { name: 'x'.repeat(161), slug: 'valid' } },
    { label: 'missing slug', input: { name: 'Client' } },
    { label: 'slug with spaces', input: { name: 'Client', slug: 'bad slug' } },
    {
      label: 'slug with doubled hyphens',
      input: { name: 'Client', slug: 'bad--slug' },
    },
    { label: 'long slug', input: { name: 'Client', slug: 'x'.repeat(81) } },
    {
      label: 'invalid status',
      input: { name: 'Client', slug: 'valid', status: 'DELETED' },
    },
    {
      label: 'unknown field',
      input: { name: 'Client', slug: 'valid', id: 'injected-id' },
    },
    { label: 'non-object body', input: null },
  ])('rejects create with $label before writing', async ({ input }) => {
    await expect(service.create('clerk-admin-1', input)).rejects.toThrow(
      BadRequestException,
    );
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('updates only supplied fields and keeps the client ID stable', async () => {
    updateRecord.mockResolvedValue({ ...row, name: 'Renamed' });
    await expect(
      service.update('clerk-admin-1', row.id, { name: ' Renamed ' }),
    ).resolves.toEqual({ ...detail, name: 'Renamed' });
    expect(updateRecord.mock.calls[0]?.[0]).toMatchObject({
      where: { id: row.id },
      data: { name: 'Renamed' },
    });
  });

  it.each([ClientStatus.PAUSED, ClientStatus.ARCHIVED])(
    'accepts status %s',
    async (status) => {
      updateRecord.mockResolvedValue({ ...row, status });
      await expect(
        service.update('clerk-admin-1', row.id, { status }),
      ).resolves.toEqual({ ...detail, status });
    },
  );

  it.each<{ label: string; input: unknown }>([
    { label: 'empty patch', input: {} },
    { label: 'undefined-only patch', input: { name: undefined } },
    { label: 'blank name', input: { name: ' ' } },
    { label: 'invalid slug', input: { slug: '-invalid' } },
    { label: 'invalid status', input: { status: 'DELETED' } },
    {
      label: 'nested membership change',
      input: { memberships: { deleteMany: {} } },
    },
  ])('rejects update with $label before writing', async ({ input }) => {
    await expect(
      service.update('clerk-admin-1', row.id, input),
    ).rejects.toThrow(BadRequestException);
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it('returns 409 when the database rejects a duplicate slug during creation', async () => {
    createRecord.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create('clerk-admin-1', { name: 'Duplicate', slug: row.slug }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns 409 when a slug change conflicts with another client', async () => {
    updateRecord.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update('clerk-admin-1', row.id, { slug: 'taken' }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns 404 when the client disappears before an update', async () => {
    updateRecord.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update('clerk-admin-1', row.id, { name: 'Changed' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not disguise unexpected database errors as slug conflicts', async () => {
    const error = new Error('Database unavailable');
    createRecord.mockRejectedValue(error);
    await expect(
      service.create('clerk-admin-1', { name: 'Client', slug: 'client' }),
    ).rejects.toBe(error);
  });
});

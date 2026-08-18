import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  PlatformRole,
  type Client,
  type DatabaseClient,
} from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';
import { ClientsService } from './clients.service';

interface LocalUser {
  id: string;
  isActive: boolean;
  platformRole: PlatformRole;
}

describe('ClientsService', () => {
  let service: ClientsService;
  const findUnique = jest.fn<Promise<LocalUser | null>, [args: unknown]>();

  const findMany = jest.fn<Promise<Client[]>, [args: unknown]>();

  const findFirst = jest.fn<Promise<Client | null>, [args: unknown]>();

  const database = {
    user: {
      findUnique,
    },
    client: {
      findMany,
      findFirst,
    },
  } as unknown as DatabaseClient;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: DATABASE_CLIENT,
          useValue: database,
        },
      ],
    }).compile();

    service = module.get(ClientsService);
  });

  it('returns only clients assigned to a platform user', async () => {
    const clients: Client[] = [];

    findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      platformRole: PlatformRole.USER,
    });

    findMany.mockResolvedValue(clients);

    await expect(service.findAccessibleTo('clerk-user-1')).resolves.toEqual(
      clients,
    );

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        clerkUserId: 'clerk-user-1',
      },
      select: {
        id: true,
        isActive: true,
        platformRole: true,
      },
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        memberships: {
          some: {
            userId: 'user-1',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('returns all clients for a platform administrator', async () => {
    const clients: Client[] = [];

    findUnique.mockResolvedValue({
      id: 'admin-1',
      isActive: true,
      platformRole: PlatformRole.ADMIN,
    });

    findMany.mockResolvedValue(clients);

    await expect(service.findAccessibleTo('clerk-admin-1')).resolves.toEqual(
      clients,
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: {
        name: 'asc',
      },
    });
  });

  it('rejects an unknown platform user', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.findAccessibleTo('unknown-clerk-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects an inactive platform user', async () => {
    findUnique.mockResolvedValue({
      id: 'inactive-user-1',
      isActive: false,
      platformRole: PlatformRole.USER,
    });

    await expect(
      service.findAccessibleTo('inactive-clerk-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns an assigned client to a platform user', async () => {
    const client = {
      id: 'client-1',
      name: 'Example Client',
    } as unknown as Client;

    findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      platformRole: PlatformRole.USER,
    });

    findFirst.mockResolvedValue(client);

    await expect(
      service.findOneAccessibleTo('clerk-user-1', 'client-1'),
    ).resolves.toEqual(client);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'client-1',
        memberships: {
          some: {
            userId: 'user-1',
          },
        },
      },
    });
  });

  it('returns any client to a platform administrator', async () => {
    const client = {
      id: 'client-1',
      name: 'Example Client',
    } as unknown as Client;

    findUnique.mockResolvedValue({
      id: 'admin-1',
      isActive: true,
      platformRole: PlatformRole.ADMIN,
    });

    findFirst.mockResolvedValue(client);

    await expect(
      service.findOneAccessibleTo('clerk-admin-1', 'client-1'),
    ).resolves.toEqual(client);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'client-1',
      },
    });
  });

  it('hides inaccessible or missing clients behind a 404', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      platformRole: PlatformRole.USER,
    });

    findFirst.mockResolvedValue(null);

    await expect(
      service.findOneAccessibleTo('clerk-user-1', 'inaccessible-client'),
    ).rejects.toThrow(NotFoundException);
  });
});

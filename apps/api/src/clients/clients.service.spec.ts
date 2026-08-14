import { Test, type TestingModule } from '@nestjs/testing';

import {
  ClientStatus,
  type Client,
  type DatabaseClient,
} from '@algoworld/database';

import { DATABASE_CLIENT } from '../database/database.constants';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;

  const clients: Client[] = [
    {
      id: 'client_1',
      name: 'Test Client',
      slug: 'test-client',
      status: ClientStatus.ACTIVE,
      createdAt: new Date('2026-08-13T00:00:00.000Z'),
      updatedAt: new Date('2026-08-13T00:00:00.000Z'),
    },
  ];

  const findMany = jest.fn().mockResolvedValue(clients);

  beforeEach(async () => {
    findMany.mockClear();

    const database = {
      client: {
        findMany,
      },
    } as unknown as DatabaseClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: DATABASE_CLIENT,
          useValue: database,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('returns clients ordered by name', async () => {
    await expect(service.findAll()).resolves.toEqual(clients);

    expect(findMany).toHaveBeenCalledWith({
      orderBy: {
        name: 'asc',
      },
    });
  });
});

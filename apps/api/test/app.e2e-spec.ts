import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';

describe('API health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds to the versioned health endpoint', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('rejects unauthenticated access to clients', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).get('/api/v1/clients').expect(401);
  });

  it('rejects unauthenticated access to client details', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).get('/api/v1/clients/client-1').expect(401);
  });
});

import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';

describe('Admin update authentication (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const base = '/api/v1/admin/clients/client-1/projects/project-1/updates';
  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication();
    configureApplication(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });
  afterAll(async () => {
    await app?.close();
  });
  it.each([base, `${base}/update-1`])(
    'rejects signed-out GET %s',
    async (path) => {
      await request(server).get(path).expect(401);
    },
  );
  it('rejects signed-out update creation', async () => {
    await request(server)
      .post(base)
      .send({
        title: 'Unauthorized',
        content: 'Unauthorized update',
        publication: { mode: 'DRAFT' },
      })
      .expect(401);
  });
  it('rejects signed-out update editing', async () => {
    await request(server)
      .put(`${base}/update-1`)
      .send({
        title: 'Unauthorized',
        content: 'Unauthorized update',
        publication: { mode: 'PUBLISH_NOW' },
      })
      .expect(401);
  });
});

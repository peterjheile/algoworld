import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';

describe('Admin milestone authentication (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const base = '/api/v1/admin/clients/client-1/projects/project-1/milestones';
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
  it.each([base, `${base}/milestone-1`])(
    'rejects signed-out GET %s',
    async (path) => {
      await request(server).get(path).expect(401);
    },
  );
  it('rejects signed-out milestone creation', async () => {
    await request(server)
      .post(base)
      .send({ title: 'Unauthorized' })
      .expect(401);
  });
  it('rejects signed-out milestone editing', async () => {
    await request(server)
      .put(`${base}/milestone-1`)
      .send({
        title: 'Unauthorized',
        description: null,
        status: 'PENDING',
        targetDate: null,
        completedAt: null,
        displayOrder: 0,
        isVisibleToClient: false,
      })
      .expect(401);
  });
});

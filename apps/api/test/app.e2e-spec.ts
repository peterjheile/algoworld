import type { Server } from 'node:http';

import { RequestMethod, type INestApplication } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-application';
import { ProjectsController } from '../src/projects/projects.controller';

describe('API health and authentication (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);

    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('responds to the versioned health endpoint', async () => {
    await request(server)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it.each([
    ['clients', '/api/v1/clients'],
    ['client details', '/api/v1/clients/client-1'],
    ['client projects', '/api/v1/clients/client-1/projects'],
    ['project timelines', '/api/v1/clients/client-1/projects/project-1'],
    ['project updates', '/api/v1/clients/client-1/projects/project-1/updates'],
    ['client updates', '/api/v1/clients/client-1/projects/updates'],
  ])('rejects unauthenticated access to %s', async (_label, path) => {
    await request(server).get(path).expect(401);
  });
});

describe('ProjectsController route-order regression', () => {
  it('declares GET updates before GET :projectId', () => {
    // Declaration-order regression check, not an authenticated HTTP test.
    // Keep all production authentication guards unchanged.
    const prototype = ProjectsController.prototype;
    const paths = Object.getOwnPropertyNames(prototype).flatMap((name) => {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        prototype,
        name,
      )?.value;

      if (typeof handler !== 'function') {
        return [];
      }

      const method: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
      const path: unknown = Reflect.getMetadata(PATH_METADATA, handler);

      return method === RequestMethod.GET && typeof path === 'string'
        ? [path]
        : [];
    });

    expect(paths).toContain('updates');
    expect(paths).toContain(':projectId');
    expect(paths.indexOf('updates')).toBeLessThan(paths.indexOf(':projectId'));
  });
});

import { type INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { clerkMiddleware } from '@clerk/express';

import type { Environment } from './config/environment';

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  app.use(
    clerkMiddleware({
      authorizedParties: config.getOrThrow<string[]>(
        'CLERK_AUTHORIZED_PARTIES',
      ),
    }),
  );
}

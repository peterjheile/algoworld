import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import type { Environment } from './config/environment';
import { configureApplication } from './configure-application';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService<Environment, true>);
  const port = config.get('PORT', { infer: true });

  configureApplication(app);

  await app.listen(port, '0.0.0.0');
}

void bootstrap();

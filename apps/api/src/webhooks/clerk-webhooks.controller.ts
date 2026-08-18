import { verifyWebhook } from '@clerk/backend/webhooks';
import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request as ExpressRequest } from 'express';

import { ClerkWebhooksService } from './clerk-webhooks.service';

function copyHeaders(request: ExpressRequest): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  return headers;
}

@Controller('webhooks/clerk')
export class ClerkWebhooksController {
  constructor(
    private readonly configService: ConfigService,
    private readonly clerkWebhooksService: ClerkWebhooksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() request: RawBodyRequest<ExpressRequest>,
  ): Promise<{ received: true }> {
    if (!request.rawBody) {
      throw new BadRequestException('Raw webhook body is unavailable.');
    }

    const verificationRequest = new Request(
      'http://localhost/api/v1/webhooks/clerk',
      {
        method: 'POST',
        headers: copyHeaders(request),
        body: request.rawBody.toString('utf8'),
      },
    );

    let event: Awaited<ReturnType<typeof verifyWebhook>>;

    try {
      event = await verifyWebhook(verificationRequest, {
        signingSecret: this.configService.getOrThrow<string>(
          'CLERK_WEBHOOK_SIGNING_SECRET',
        ),
      });
    } catch {
      throw new BadRequestException('Invalid webhook signature.');
    }

    await this.clerkWebhooksService.handle(event);

    return {
      received: true,
    };
  }
}

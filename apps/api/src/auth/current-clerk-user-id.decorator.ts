import { getAuth } from '@clerk/express';
import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export const CurrentClerkUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();

    const auth = getAuth(request, {
      acceptsToken: 'session_token',
    });

    if (!auth.isAuthenticated || !auth.userId) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return auth.userId;
  },
);

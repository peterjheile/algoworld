import { getAuth } from '@clerk/express';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const auth = getAuth(request, {
      acceptsToken: 'session_token',
    });

    if (!auth.isAuthenticated) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return true;
  }
}

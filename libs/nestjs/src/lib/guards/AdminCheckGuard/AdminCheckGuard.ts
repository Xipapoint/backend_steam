import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%_-/*';
const regex = new RegExp(`^[${characters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]{15}$`);

@Injectable()
export class AdminCheckGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const code = request.headers['x-admin-token'] as string;

    if (!code) {
      throw new UnauthorizedException('Access code required');
    }

    if (!regex.test(code)) {
      throw new ForbiddenException('Invalid access code format');
    }

    // TODO: CHANGE TO CONFIG SERVICE
    if (code !== "BJBrP510qOMHTFd") {
      throw new ForbiddenException('Invalid access code');
    }

    return true;
    }
}
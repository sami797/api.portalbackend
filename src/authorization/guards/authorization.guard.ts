import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../authorization.service';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector, private authorizationService: AuthorizationService) {
}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user : AuthenticatedUser = request.user;
    const requiredPermissions = this.reflector.get<string[]>('REQUIRED_PERMISSIONS', context.getHandler());
    if(!requiredPermissions) return true;
    if(!user) return false;
    return this.authorizationService.checkIfUserAuthorized(user, requiredPermissions);
  }
}

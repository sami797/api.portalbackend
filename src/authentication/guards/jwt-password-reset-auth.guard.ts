import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtPasswordResetAuthGuard extends AuthGuard('jwt-password-reset-token') {}

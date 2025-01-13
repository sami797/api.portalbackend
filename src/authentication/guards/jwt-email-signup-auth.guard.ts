import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtEmailSignupAuthGuard extends AuthGuard('jwt-email-signup-token') {}

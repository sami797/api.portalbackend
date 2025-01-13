import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtPhoneSignupAuthGuard extends AuthGuard('jwt-phone-signup-token') {}

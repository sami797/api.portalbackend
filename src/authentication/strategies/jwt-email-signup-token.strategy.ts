import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt-constants';
import { Request } from 'express';
import { AuthenticatedUserEmail } from '../jwt-payload';

@Injectable()
export class JwtEmailSignupTokenStrategy extends PassportStrategy(Strategy,'jwt-email-signup-token') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("signupToken"),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.signupTempTokenSecret,
      passReqToCallback: true
    });
  }

  async validate(req : Request , payload: AuthenticatedUserEmail) {
    return {email: payload.email, userAgent: payload.userAgent}
  }

}

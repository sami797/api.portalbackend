import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt-constants';
import { Request } from 'express';
import { AuthenticatedUserPhone } from '../jwt-payload';

@Injectable()
export class JwtPhoneSignupTokenStrategy extends PassportStrategy(Strategy,'jwt-phone-signup-token') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("signupToken"),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.signupTempTokenSecret,
      passReqToCallback: true
    });
  }

  async validate(req : Request , payload: AuthenticatedUserPhone) {
    return {phone: payload.phone, phoneCode: payload.phoneCode, userAgent: payload.userAgent}
  }

}

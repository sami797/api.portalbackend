import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt-constants';
import { AuthenticatedUser } from '../jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.accessTokensecret,
    });
  }

  async validate(payload: AuthenticatedUser) : Promise<AuthenticatedUser> {
    console.log('JWT Payload:', payload);
    return { userId: payload.userId, userUid: payload.userUid, userEmail: payload.userEmail, roles: payload.roles, 
      organization: (payload.organization) ?{
        ...payload.organization
      } : undefined,
      litmitAccessTo: payload.litmitAccessTo,
      department: (payload.department) ? {
      id: payload?.department?.id,
      title: payload?.department?.slug,
      slug: payload?.department?.slug
    } : undefined};
  }
}

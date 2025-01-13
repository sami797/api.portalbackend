import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt-constants';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { ResponseError } from 'src/common-types/common-types';
import { AuthenticatedUser } from '../jwt-payload';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy,'jwt-refresh-token') {
  constructor(private authService : AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshTokenSecret,
      passReqToCallback: true
    });
  }

  async validate( req : Request ,payload: AuthenticatedUser) {
    try{
      const refreshToken = this.getToken(req);
      if(refreshToken){
        const isValidToken = await this.authService.validateRefreshToken(refreshToken, payload.userId);
        if(!isValidToken) throw new Error;
        return payload;
      }
    }catch(err){
      let errorResponse: ResponseError = { message: "Token invalid, expired or may be regenerated already, please login again to get the access token", statusCode: 404, data: {} }
      throw new NotFoundException(errorResponse);
    }
    
  }


  getToken (req: Request) {
    if(req.body.refreshToken){
      return req.body.refreshToken;
    }
    return null;
  }

}

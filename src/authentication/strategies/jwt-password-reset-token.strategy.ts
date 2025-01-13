import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../../config/jwt-constants';
import { Request } from 'express';
import { AuthenticatedResetToken } from '../jwt-payload';
import { AuthService } from '../auth.service';
import { ResponseError } from 'src/common-types/common-types';
import { AuthTokenStatus } from 'src/config/constants';

@Injectable()
export class JwtPasswordResetTokenStrategy extends PassportStrategy(Strategy, 'jwt-password-reset-token') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("resetToken"),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.passwordResetTokenSecret,
      passReqToCallback: true
    });
  }


  async validate(req: Request, payload: AuthenticatedResetToken) {
    try {
      const resetToken = this.getToken(req);
      if (!resetToken) throw new Error;
      if (resetToken) {
        const tokenData = await this.authService.validatePasswordResetToken(resetToken);
        if (tokenData) {
          if (tokenData.status === AuthTokenStatus.active) {
            return payload
          } else if (tokenData.status == AuthTokenStatus.expired) {
            throw {
              message: "Token invalid. You have requested a new reset token. Please try with new token received.",
              statusCode: 400
            }
          } else if (tokenData.status == AuthTokenStatus.used) {
            throw {
              message: "You have already updated the password using this token. Pleae request for a new token and try again",
              statusCode: 400
            }
          } else {
            return payload
          }

        } else {
          throw {
            message: "Reset Token not found. Please request for a new token and try again.",
            statusCode: 404
          }
        }

      }
    } catch (err) {
      let errorResponse: ResponseError = { message: err.message, statusCode: err.statusCode, data: {} }
      throw new NotFoundException(errorResponse);
    }
  }


  getToken(req: Request) {
    if (req.body.resetToken) {
      return req.body.resetToken;
    }
    return null;
  }

}

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../config/jwt-constants';
import {  AuthenticatedUser} from './jwt-payload';


@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) { }

  async verifyUserToken(token : string,ignoreExpiration: boolean = false){
    token = token.replace('Bearer ','');
    const verifyOptions = { secret: jwtConstants.accessTokensecret, ignoreExpiration: ignoreExpiration};
    try{
    const payload : AuthenticatedUser = await this.jwtService.verifyAsync(token, verifyOptions);
    return payload;
    }catch(err){
      throw {message: err.message, statusCode: 401}
    }
  }

  async verifyUserSubscriptionToken(token : string,ignoreExpiration: boolean = false){
    token = token.replace('Bearer ','');
    const verifyOptions = { secret: jwtConstants.userSubscriptionTokenSecret, ignoreExpiration: ignoreExpiration};
    try{
    const payload : AuthenticatedUser = await this.jwtService.verifyAsync(token, verifyOptions);
    return payload;
    }catch(err){
      throw {message: err.message, statusCode: 401}
    }
  }

  generateUnsubscribeToken(userId: number) {
    const payload = {
      userId: userId
    };
    return this.jwtService.sign(payload, { secret: jwtConstants.userSubscriptionTokenSecret, expiresIn: jwtConstants.userSubscriptionTokenExpiry });
  }

}

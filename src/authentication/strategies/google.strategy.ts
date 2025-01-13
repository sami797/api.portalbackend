import { Inject, Injectable } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import config from '../../config/config';
// import { User } from '../../users/entities/user.entity';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    // @Inject(config.KEY) private configService: ConfigType<typeof config>,
    // @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
   try{
    const { id, name, emails, photos } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      profile: photos[0].value,
    };

    done(null, user);
   }catch(err){
    throw {message: err.message, statusCode: 400}
   }
  }
}
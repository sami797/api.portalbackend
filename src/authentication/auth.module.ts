import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from '../modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from '../config/jwt-constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { JwtPhoneSignupTokenStrategy } from './strategies/jwt-phone-signup-token.strategy';
import { JwtEmailSignupTokenStrategy } from './strategies/jwt-email-signup-token.strategy';
import { JwtPasswordResetTokenStrategy } from './strategies/jwt-password-reset-token.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MailModule } from 'src/mail/mail.module';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  imports: [
    UserModule,
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.accessTokensecret,
      signOptions: { expiresIn: jwtConstants.accessTokenExpiry },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    JwtPhoneSignupTokenStrategy,
    JwtEmailSignupTokenStrategy,
    JwtPasswordResetTokenStrategy,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    GoogleAuthService,
    GoogleStrategy,
    AuthorizationService
  ],
  exports: [TokenService]
})
export class AuthModule { }

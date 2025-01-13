import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PrismaService } from 'src/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthorizationGuard } from './guards/authorization.guard';

@Module({
  providers: [AuthorizationService, PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
  // exports: [AuthorizationService]
})
export class AuthorizationModule {}

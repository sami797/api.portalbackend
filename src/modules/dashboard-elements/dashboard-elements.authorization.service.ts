import { Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }
}
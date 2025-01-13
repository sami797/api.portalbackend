import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CashAdvanceAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForCashAdvance(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let record = await this.prisma.cashAdvanceRequest.findFirst({
      where:{
        id: recordId
      },
    })

    if(record.requestById === user.userId){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }
}
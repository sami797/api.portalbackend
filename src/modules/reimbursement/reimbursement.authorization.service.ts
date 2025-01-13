import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { ReimbursementPermissionSet } from './reimbursement.permissions';

@Injectable()
export class ReimbursementAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForReimbursement(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[ReimbursementPermissionSet.FINANCE_APPROVAL, ReimbursementPermissionSet.HR_APPROVAL]>(user, [ReimbursementPermissionSet.FINANCE_APPROVAL, ReimbursementPermissionSet.HR_APPROVAL])
    if(permissions.reimbursementFinanceApproval || permissions.reimbursementHRApproval){
      return true;
    }
    
    let record = await this.prisma.reimbursement.findFirst({
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
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { DairyPermissionSet } from './diary.permissions';

@Injectable()
export class DiaryAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForUser(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[DairyPermissionSet.READ]>(user, [DairyPermissionSet.READ])
    if(permissions.readDairy){
      return true;
    }
    
    let record = await this.prisma.user.findFirst({
      where:{
        id: recordId
      },
      select:{
        id: true,
        managerId: true
      }
    })

    if(record.id === user.userId || record.managerId === user.userId){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async isAuthorizedForUserDocument(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[DairyPermissionSet.READ]>(user, [DairyPermissionSet.READ])
    if(permissions.readDairy){
      return true;
    }
    
    let record = await this.prisma.userDocument.findFirst({
      where:{
        id: recordId
      },
      select:{
        id: true,
        userId: true
      }
    })

    if(record.userId === user.userId){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }
}
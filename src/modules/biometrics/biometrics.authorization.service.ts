import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { BiometricsPermissionSet } from './biometrics.permissions';

@Injectable()
export class BiometricsAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForBiometrics(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions =  await this.findUserPermissionsAgainstSlugs<[BiometricsPermissionSet.READ_ALL]>(user,[BiometricsPermissionSet.READ_ALL])
    if(!permissions.readAllBiometrics){
      return true
    }
    
    let record = await this.prisma.biometricsChecks.findFirst({
      where:{
        id: recordId
      },
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
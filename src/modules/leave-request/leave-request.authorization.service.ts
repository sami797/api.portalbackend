import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { UserDefaultAttributes } from '../user/dto/user.dto';

@Injectable()
export class LeaveRequestAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForLeaveRequest(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let record = await this.prisma.leaveRequest.findFirst({
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

  async isAuthorizedForLeaveRequestToRead(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let record = await this.prisma.leaveRequest.findFirst({
      where:{
        id: recordId
      },
    })

    if(record.requestById === user.userId){
      return true
    }

    let userData =  await this.prisma.user.findFirst({
      where:{
        Employees:{
          some:{
            id: record.requestById
          }
        }
      }
    })

    if(userData){
      return true
    }

    throw {
      message: "Forbidden Resource.",
      statusCode: 403
    }

  }

   async isUserProjectManager(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let record = await this.prisma.leaveRequest.findFirst({
      where:{
        id: recordId
      },
      select:{
        requestById: true,
        RequestBy:{
          select: UserDefaultAttributes
        }
      }
    })

    if(!record){
      throw {
        message: "No record found",
        statusCode: 404
      }
    }

    let userData =  await this.prisma.user.findFirst({
      where:{
        Employees:{
          some:{
            id: record.requestById
          }
        }
      }
    })

    if(userData){
      return true
    }

    throw {
      message: "Forbidden Resource. You are not a manager of" + record.RequestBy?.firstName,
      statusCode: 403
    }
  }
}
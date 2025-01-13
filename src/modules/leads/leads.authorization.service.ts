import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { LeadsPermissionSet } from './leads.permissions';

@Injectable()
export class LeadsAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForLeads(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[LeadsPermissionSet.READ_ALL]>(user, [LeadsPermissionSet.READ_ALL])
    if(permissions.readAllLeads){
      return true;
    }
    
    let record = await this.prisma.leads.findFirst({
      where:{
        id: recordId,
        AND:{
          OR:[
            {addedById: user.userId},
            {assignedToId: user.userId}
          ]
        }
      },
    })

    if(record){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async isAuthorizedForLeadsNote(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[LeadsPermissionSet.READ_ALL]>(user, [LeadsPermissionSet.READ_ALL])
    if(permissions.readAllLeads){
      return true;
    }
    
    let record = await this.prisma.leadEnquiryFollowUp.findFirst({
      where:{
        id: recordId,
        AND:{
          OR:[
            {
              Lead:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            },
            {
              Enquiry:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            }
          ]
        }
      },
    })

    if(record){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }


  async isAuthorizedForLeadsDocument(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[LeadsPermissionSet.READ_ALL]>(user, [LeadsPermissionSet.READ_ALL])
    if(permissions.readAllLeads){
      return true;
    }
    
    let record = await this.prisma.enquiryAttachment.findFirst({
      where:{
        id: recordId,
        AND:{
          OR:[
            {
              Lead:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            },
            {
              Enquiry:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            }
          ]
        }
      },
    })

    if(record){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }
}
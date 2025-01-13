import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { EnquiryPermissionSet } from './enquiry.permissions';

@Injectable()
export class EnquiryAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async isAuthorizedForEnquiry(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[EnquiryPermissionSet.READ_ALL]>(user, [EnquiryPermissionSet.READ_ALL])
    if(permissions.readAllEnquiry){
      return true;
    }
    
    let record = await this.prisma.enquiry.findFirst({
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

  async isAuthorizedForEnquiryNote(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[EnquiryPermissionSet.READ_ALL]>(user, [EnquiryPermissionSet.READ_ALL])
    if(permissions.readAllEnquiry){
      return true;
    }
    
    let record = await this.prisma.leadEnquiryFollowUp.findFirst({
      where:{
        id: recordId,
        AND:{
          OR:[
            {
              Enquiry:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            },
            {
              Lead:{
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

  async isAuthorizedForEnquiryDocument(recordId: number, user: AuthenticatedUser){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let permissions = await this.findUserPermissionsAgainstSlugs<[EnquiryPermissionSet.READ_ALL]>(user, [EnquiryPermissionSet.READ_ALL])
    if(permissions.readAllEnquiry){
      return true;
    }
    
    let record = await this.prisma.enquiryAttachment.findFirst({
      where:{
        id: recordId,
        AND:{
          OR:[
            {
              Enquiry:{
                AND:{
                  OR:[
                    {addedById: user.userId},
                    {assignedToId: user.userId}
                  ]
                }
              }
            },
            {
              Lead:{
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
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { ProjectPermissionSet } from './project.permissions';

@Injectable()
export class ProjectAuthorizationService extends AuthorizationService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
   }

   async checkIfUserAuthorizedForProject(user: AuthenticatedUser, projectId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.project.findFirst({
      where:{
        id: projectId,
        ProjectMembers:{
          some:{
            userId: user.userId
          }
        }
      },
    })

    if(prj){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForProjectFile(user: AuthenticatedUser, fileId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let hasGlobalPermission = await this.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
    if(hasGlobalPermission.updateAnyProject) return true;
    let prj = await this.prisma.fileManagement.findFirst({
      where:{
        id: fileId,
        Project:{
          ProjectMembers:{
            some:{
              userId: user.userId
            }
          }
        }
      },
    })

    if(prj){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForProjectNote(user: AuthenticatedUser, noteId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.projectConversation.findFirst({
      where:{
        id: noteId,
        userId: user.userId
      },
    })

    if(prj){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForProjectNoteMedia(user: AuthenticatedUser, noteId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.fileManagement.findFirst({
      where:{
        id: noteId,
        addedById: user.userId
      },
    })

    if(prj){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }
}
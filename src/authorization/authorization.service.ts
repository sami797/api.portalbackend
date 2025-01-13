import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ProjectRole, SUPER_ADMIN, SYSTEM_USERS, TaskType } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthorizationService {
  constructor(protected readonly prisma: PrismaService) { }
  async checkIfUserAuthorized(user: AuthenticatedUser, requiredPermissions: string[]): Promise<boolean> {
    const userRoles = user.roles;
    if (!userRoles) return false;
    if (userRoles.slugs.includes(SUPER_ADMIN)) return true;

    let data = await this.prisma.rolePermissions.findMany({
      where: {
        AND: [
          {
            roleId: {
              in: user.roles.ids
            }
          },
          {
            Permission: {
              action: {
                in: requiredPermissions
              }
            }
          }
        ]
      },
      select: {
        Permission: {
          select: {
            action: true
          }
        }
      }
    })

    let foundSlugs = data.map((ele) => {
      return ele.Permission.action;
    })

    return requiredPermissions.every(function (ele) {
      if (!foundSlugs.includes(ele)) {
        return false;
      };
      return true;
    })
  }

  async checkIfUserAuthorizedForSavedSearches(user: AuthenticatedUser, savedSearchId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let userAlert = await this.prisma.savedSearches.findFirst({
      where: {
        id: savedSearchId
      }
    })
    if (!userAlert){
      throw {
        message: "User Alerts not found in the system.",
        statusCode: 404
      }
    };
    if(user.userId === userAlert.userId){
      return true
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserCanReadOrganzationResources(user: AuthenticatedUser, filePath: string){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let fileInfo = await this.prisma.fileManagement.findFirst({
      where: {
        path: filePath
      },
      select: {
        Project: {
          select: { 
            clientId: true,
            id: true,
          }
        }
      }
    })
    if (!fileInfo || !fileInfo.Project.clientId){
      throw {
        message: "Client not found in the system.",
        statusCode: 404
      }
    };

    let agency = fileInfo.Project
    // if (user.organization?.id === agency.id) {return true;}
    // if (user.roles.slugs.includes(YALLAH_USERS) && user.countryAccess) {
    //   for (const ele of user.countryAccess) {
    //     if (ele.countryId === agency.countryId) {
    //       return true
    //     }
    //   }
    // }
    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserCanReadProjectResources(user: AuthenticatedUser, filePath: string){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let fileInfo = await this.prisma.fileManagement.findFirst({
      where: {
        path: filePath
      },
      select: {
        visibility: true,
        addedById: true,
        Project: {
          select: {
            id: true,
            clientId: true,
            addedById: true,
            ProjectMembers:{
              select:{
                userId: true,
                projectRole: true
              }
            },
            ProjectClient:{
              select:{
                clientId: true
              }
            }
          }
        }
      }
    })
    if (!fileInfo || !fileInfo.Project){
      throw {
        message: "File not found in the system.",
        statusCode: 404
      }
    };

    if(fileInfo.addedById === user.userId || fileInfo.Project.addedById === user.userId){
      //is a file owner or a project owner
      return true
    }

    let prj = fileInfo.Project;
    let userBelongsToProject = false;
    for(const t of prj.ProjectMembers){
      if(t.userId === user.userId){
        userBelongsToProject = true
        break
      }
    }

    if(userBelongsToProject){
      return true;
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserCanReadTaskResources(user: AuthenticatedUser, filePath: string){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let fileInfo = await this.prisma.fileManagement.findFirst({
      where: {
        path: filePath
      },
      select: {
        visibility: true,
        addedById: true,
        Task: {
          select: {
            id: true,
            addedById: true,
            TaskMembers:{
              select:{
                userId: true,
              }
            }
          }
        }
      }
    })
    if (!fileInfo || !fileInfo.Task){
      throw {
        message: "File not found in the system.",
        statusCode: 404
      }
    };

    if(fileInfo.addedById === user.userId || fileInfo.Task.addedById === user.userId){
      //is a file owner or a project owner
      return true
    }

    let prj = fileInfo.Task;
    let userBelongsToProject = false;
    for(const t of prj.TaskMembers){
      if(t.userId === user.userId){
        userBelongsToProject = true;
        break
      }
    }

    if(userBelongsToProject){
      return true;
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForProjectResources(user: AuthenticatedUser, fileId: number){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let fileInfo = await this.prisma.fileManagement.findFirst({
      where: {
        id: fileId
      },
      select: {
        visibility: true,
        addedById: true,
        Project: {
          select: {
            id: true,
            clientId: true,
            addedById: true,
            ProjectMembers:{
              select:{
                userId: true,
                projectRole: true
              }
            }
          }
        }
      }
    })
    if (!fileInfo || !fileInfo.Project){
      throw {
        message: "File not found in the system.",
        statusCode: 404
      }
    };

    if(fileInfo.addedById === user.userId || fileInfo.Project.addedById === user.userId){
      //is a file owner or a project owner
      return true
    }

    let prj = fileInfo.Project;
    let userBelongsToProject = false;
    for(const t of prj.ProjectMembers){
      if(t.userId === user.userId){
        userBelongsToProject = true
        break
      }
    }

    if(userBelongsToProject){
      return true;
    }

    throw {
      message: "Forbidden resource",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForTask(user: AuthenticatedUser, taskId: number, techSupportPermission?: boolean){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.task.findFirst({
      where:{
        id: taskId,
        AND:{
          OR:[
            {
              TaskMembers:{
                some:{
                  userId: user.userId
                }
              }
            },
            (techSupportPermission) ?
            {
              type: TaskType.techSupport
            }: undefined
          ]
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

  async checkIfUserAuthorizedForTaskFile(user: AuthenticatedUser, taskFileId: number, techSupportPermission?: boolean){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.fileManagement.findFirst({
      where:{
        id: taskFileId,
        Task:{
          AND:{
            OR:[
              {
                TaskMembers:{
                  some:{
                    userId: user.userId
                  }
                }
              },
              (techSupportPermission) ?
              {
                type: TaskType.techSupport
              }: undefined
            ]
          }
        }
      },
    })

    if(prj){
      return true
    }

    throw {
      message: "Sorry you are not Authorized!",
      statusCode: 403
    }
  }

  async checkIfUserAuthorizedForProjectBySlug(user: AuthenticatedUser, slug: string){
    if (user.roles.slugs.includes(SUPER_ADMIN)) {return true; }
    let prj = await this.prisma.project.findFirst({
      where:{
        slug: slug,
        AND:{
          OR: [
            {
              ProjectMembers:{
                some:{
                  userId: user.userId
                }
              }
            },
            {
              addedById: user.userId
            }
          ]
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

  async findUserPermissionsAgainstSlugs<PERMISSION_SLUGS extends string[]>(user: AuthenticatedUser, slugs: PERMISSION_SLUGS) : Promise<Partial<{[K in PERMISSION_SLUGS[number]] : boolean}>> {
    const results: {[K in PERMISSION_SLUGS[number]]: boolean} = {} as {[K in PERMISSION_SLUGS[number]]: boolean};
    let __slugs = (Array.isArray(slugs) ? slugs : [slugs]) as string[]
    if (user.roles.slugs.includes(SUPER_ADMIN)) {
      __slugs.map(function (ele) {
        results[ele] = true;
      })
      return results;
    } else {
      let dt = await this.prisma.rolePermissions.findMany({
        where: {
          AND: [
            {
              roleId: {
                in: user.roles.ids
              }
            },
            {
              Permission: {
                action: {
                  in: __slugs
                }
              }
            }
          ]
        },
        select: {
          Permission: {
            select: {
              action: true
            }
          }
        }
      })

      let foundSlugs = dt.map((ele) => {
        return ele.Permission.action;
      })

      __slugs.map(function (ele) {
        results[ele] = foundSlugs.includes(ele);
      })

      return results;
    }
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileVisibility, FileshareLogs, Prisma } from '@prisma/client';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFiltersDto } from './dto/project-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { UploadProjectFiles } from './dto/upload-files.dto';
import { extractIds, generateUUID, getEnumKeyByValue, getMinutesDiff } from 'src/helpers/common';
import { ProjectDocumentsTypes } from './entities/project.entity';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { FileStatus, InvoiceStatus, ProjectRole, QuotationStatus, TransactionStatus } from 'src/config/constants';
import { RemoveProjectClient, RemoveProjectMember } from './dto/remove-project-member.dto';
import { UpdateProjectMember } from './dto/update-project-member.dto';
import { UpdateProjectStatus } from './dto/update-project-status.dto';
import { ProjectResourcesFiltersDto } from './dto/project-resouces-filters.dto';
import { ProjectCommentAndNotesFiltersDto } from './dto/project-comment-notes-filters.dto';
import { CreateProjectNoteDto } from './dto/create-project-note.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ClientDefaultAttributes } from '../client/dto/client.dto';
import { HoldProjectDto, UnholdProjectDto } from './dto/hold-project.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { UpdateProjectFiles } from './dto/update-files.dto';
import { ProjectNotePaginationDto } from './dto/project-note.pagination.dto';
import * as BluebirdPromise from 'bluebird';
import { ProjectChatFiltersDto } from './dto/project-chat-filters.dto';
import { ShareFilesToClient } from './dto/share-files-to-client.dto';
import { ProjectDefaultAttributes } from './dto/project.dto';
import { MailService } from 'src/mail/mail.service';
import { ChatGateway } from '../chat/chat.gateway';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { XeroProcessNames } from '../xero-accounting/process/xero.process.config';
import { NotificationEventDto } from '../notification/dto/notification.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateProjectEnableStateDto } from './dto/create-project-enable-state.dto';
import { UpdateProjectEnableStateDto } from './dto/update-project-enable-state.dto';

@Injectable()
export class ProjectService {

  private readonly logger = new Logger(ProjectService.name);
  constructor(private prisma: PrismaService, 
    private readonly mailService: MailService, 
    private readonly chatGateway: ChatGateway,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('xero') private xeroQueue: Queue
    ) {
  }

  async create(createDto: CreateProjectDto) {
    const { clientRepresentativeId, projectInchargeId, supportEngineersId, clients, ...rest } = createDto;
    let recordData: Prisma.ProjectUncheckedCreateInput = rest;
    let projectState = await this.prisma.projectState.findFirst({
      where: {
        isDefault: true
      },
      orderBy: {
        order: 'asc'
      }
    })
    if (projectState) {
      recordData.projectStateId = projectState.id;
    }
    if (createDto.startDate) {
      recordData.startDate = new Date(createDto.startDate)
    }
    if (createDto.endDate) {
      recordData.endDate = new Date(createDto.endDate)
    }
    return this.prisma.project.create({
      data: recordData,
    })
      .then(async (data) => {
        let dt: Array<Prisma.ProjectMembersCreateManyInput> = []
        let dtClients: Array<Prisma.ProjectClientCreateManyInput> = []

        if (projectInchargeId && projectInchargeId.length > 0) {
          let uniqueIds = [];
          projectInchargeId.map((ele) => {
            if (!uniqueIds.includes(ele)) {
              uniqueIds.push(ele);
            }
          })
          uniqueIds.forEach((ele) => {
            dt.push({
              projectId: data.id,
              userId: ele,
              projectRole: ProjectRole.projectIncharge
            })
          })
        }

        // if (projectInchargeId) {
        //   dt.push({
        //     projectId: data.id,
        //     userId: projectInchargeId,
        //     projectRole: ProjectRole.projectIncharge
        //   })
        // }


        if (supportEngineersId && supportEngineersId.length > 0) {
          let uniqueIds = [];
          supportEngineersId.map((ele) => {
            if (!uniqueIds.includes(ele)) {
              uniqueIds.push(ele);
            }
          })
          uniqueIds.forEach((ele) => {
            dt.push({
              projectId: data.id,
              userId: ele,
              projectRole: ProjectRole.supportEngineers
            })
          })
        }

        if (clientRepresentativeId) {
          dtClients.push({
            projectId: data.id,
            clientId: clientRepresentativeId,
            isRepresentative: true
          })
        }

        if (clients && clients.length > 0) {
          let uniqueIds = [];
          clients.map((ele) => {
            if (!uniqueIds.includes(ele) && ele !== clientRepresentativeId) {
              uniqueIds.push(ele);
            }
          })
          uniqueIds.forEach((ele) => {
            dtClients.push({
              projectId: data.id,
              clientId: ele,
              isRepresentative: false
            })
          })
        }

        await this.prisma.projectMembers.createMany({
          data: dt
        }).catch((err) => {
          this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        })

        await this.prisma.projectClient.createMany({
          data: dtClients
        }).catch((err) => {
          this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        })

        return data;
      })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }


  findAll(filters: Prisma.ProjectWhereInput, pagination: Pagination, rawFilters: ProjectFiltersDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.project.findMany({
      where: filters,
      skip: skip,
      take: take,
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        priority: true,
        referenceNumber: true,
        leadId: true,
        ProjectState: {
          select: {
            id: true,
            title: true,
            slug: true,
            bgColor: true,
            textColor: true
          }
        },
        ProjectEnableStates: {
          select: {
            id: true,
            pId: true,
            pstateId: true,
          }
        },
        addedDate: true,
        ProjectMembers: {
          select: {
            projectRole: true,
            userId: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true
              }
            }
          },
          orderBy: {
            projectRole: 'asc'
          }
        },
        ProjectClient: {
          select: {
            clientId: true,
            Client: {
              select: ClientDefaultAttributes
            }
          }
        },
        ProjectType: {
          select: {
            title: true,
            slug: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: {
            name: true,
            logo: true,
            uuid: true
          }
        },
        _count: {
          select: {
            Resources: {
              where: {
                isDeleted: false
              }
            }
          }
        }
      },
      orderBy: (rawFilters.delayed) ? {
        endDate: 'asc'
      } : {
        addedDate: 'desc'
      }
    });
  }

  async getPriorizedDataInConversation(recordId: number, user: AuthenticatedUser){
    return this.prisma.project.findFirst({
      where: {
        id: recordId
      },
      select: {
        id: true,
        title: true,
        slug: true,
        referenceNumber: true,
        onHold: true,
        ProjectMembers: {
          select: {
            projectRole: true,
            userId: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true
              }
            }
          },
          orderBy: {
            projectRole: 'asc'
          }
        },
        ProjectConversation:{
          where:{
            isDeleted: false
          },
          select:{
            message: true,
            addedDate: true,
            _count:{
              select:{
                Media:{
                  where:{
                    isDeleted: false
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            ProjectConversation:{
              where:{
                AND:{
                  isDeleted: false,
                  OR:[
                    {
                      ReadLog:{
                        some:{
                          userId:user.userId,
                          read: false
                        }
                      }
                    },
                    {
                      ReadLog:{
                        none:{
                          userId:user.userId
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
  }

  async getProjectForConversation(filters: ProjectChatFiltersDto, pagination: Pagination, user: AuthenticatedUser, readAllProject: boolean) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;

    let condition = "";
    if (filters.title) {
      condition = ` AND ("p"."title" ILIKE '%${filters.title}%' OR "p"."referenceNumber" ILIKE '%${filters.title}%')`;
    }

    const rawQuery = `
    SELECT
      "p"."id",
      "p"."title",
      "p"."slug",
      "p"."onHold",
      "p"."referenceNumber",
      "pm"."projectRole",
      "pm"."userId",
      "u"."firstName",
      "u"."lastName",
      "u"."email",
      "u"."profile",
      "u"."id" AS userId,
      "u"."uuid",
      "pc"."message" AS pcmessage,
      "pc"."addedDate" AS pcaddeddate,
      "pc"."mediacount",
      (
        SELECT COUNT(*)
        FROM "ProjectConversation" AS pc
        WHERE
          "pc"."projectId" = p.id AND
          "pc"."isDeleted" = false AND
          "pc"."userId" <> ${user.userId} AND
          (
            EXISTS (
              SELECT 1
              FROM "ProjectConversationReadLog" AS rl
              WHERE "rl"."conversationId" = "pc".id AND "rl"."userId" = ${user.userId} AND "rl"."read" = false
            ) OR
            NOT EXISTS (
              SELECT 1
              FROM "ProjectConversationReadLog" AS rl
              WHERE "rl"."conversationId" = "pc".id AND "rl"."userId" = ${user.userId}
            )
          )
      ) AS pcCount
    FROM "Project" AS p
    LEFT JOIN "ProjectMembers" AS "pm" ON "pm"."projectId" = p.id
    LEFT JOIN "User" AS "u" ON "pm"."userId" = "u"."id" AND "u"."isDeleted" = FALSE
    LEFT JOIN LATERAL (
      SELECT
        "message",
        "addedDate",
        (
          SELECT COUNT(*)
          FROM "FileManagement" AS "pcMedia"
          WHERE
            "pcMedia"."projectConversationId" = "pc"."id" AND
            "pcMedia"."isDeleted" = false
        ) AS "mediacount"
      FROM "ProjectConversation" AS "pc"
      WHERE "pc"."projectId" = p.id AND "pc"."isDeleted" = false
      ORDER BY "addedDate" DESC
      LIMIT 1
    ) AS "pc" ON TRUE
    WHERE "p"."isDeleted" = false ${condition} ${readAllProject ? "" : ` AND
    "p"."id" IN (
      SELECT "projectId"
      FROM "ProjectMembers"
      WHERE "userId" = ${user.userId}
    )`}
    ORDER BY CASE WHEN "pc"."addedDate" IS NULL THEN 1 ELSE 0 END, "pc"."addedDate" DESC
    OFFSET ${skip} LIMIT ${take};
    ;
  `;
    const rawData: Array<any> = await this.prisma.$queryRawUnsafe(rawQuery);
    const projectsMap = new Map();
    rawData.forEach((row) => {
      const projectId = row.id;

      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: row.id,
          title: row.title,
          slug: row.slug,
          referenceNumber: row.referenceNumber,
          onHold: row.onHold,
          ProjectMembers: [],
          ProjectConversation: {
            message: row.pcmessage,
            addedDate: row.pcaddeddate,
            mediaCount: Number(row.mediacount),
          },
          unreadConversationCount: Number(row.pccount),
        });
      }

      if (row.userId) {
        projectsMap.get(projectId).ProjectMembers.push({
          projectRole: row.projectRole,
          userId: row.userId,
          User: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            profile: row.profile,
            id: row.userId,
            uuid: row.uuid,
          },
        });
      }
    });

    const organizedData = Array.from(projectsMap.values());
    if(filters.id){
      let rData = await this.getPriorizedDataInConversation(filters.id, user);
      organizedData.unshift({
        id: rData.id,
        title: rData.title,
        slug: rData.slug,
        referenceNumber: rData.referenceNumber,
        onHold: rData.onHold,
        ProjectConversation: (rData.ProjectConversation && rData.ProjectConversation.length > 0) ? {
          message: rData.ProjectConversation[0].message,
          addedDate: rData.ProjectConversation[0].addedDate,
          mediaCount: rData.ProjectConversation[0]?._count?.Media,
        } : undefined,
        unreadConversationCount: rData._count?.ProjectConversation,
        ProjectMembers: rData.ProjectMembers
      })
    }
    return organizedData;
  }

  findProjectList(filters: Prisma.ProjectWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.project.findMany({
      where: filters,
      skip: skip,
      take: take,
      select: {
        id: true,
        title: true,
        slug: true,
        referenceNumber: true,
        leadId: true,
        submissionById: true,
        clientId: true
      },
      orderBy: {
        id: 'desc'
      }
    });
  }

  findAllPublished(filters: Prisma.ProjectWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.project.findMany({
      where: filters,
      skip: skip,
      take: take,
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        priority: true,
        referenceNumber: true,
        ProjectState: {
          select: {
            id: true,
            title: true,
            slug: true,
            bgColor: true,
            textColor: true
          }
        },
        ProjectEnableStates: {
          select: {
            id: true,
            pId: true,
            pstateId: true,
          }
        },
        addedDate: true,
        ProjectMembers: {
          select: {
            projectRole: true,
            userId: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true
              }
            }
          },
          orderBy: {
            projectRole: 'asc'
          }
        },
        ProjectClient: {
          select: {
            clientId: true,
            Client: {
              select: ClientDefaultAttributes
            }
          }
        },
        ProjectType: {
          select: {
            title: true,
            slug: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: {
            name: true,
            logo: true,
            uuid: true
          }
        },
        _count: {
          select: {
            Resources: {
              where: {
                isDeleted: false
              }
            },
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.project.findUnique({
      where: {
        id: id
      },
      include: {
        Quotation: {
          select: {
            id: true,
            scopeOfWork: true,
            QuotationMilestone: {
              select: {
                id: true,
                title: true,
                amount: true,
                status: true
              }
            }
          },
          where: {
            status: QuotationStatus.confirmed
          }
        },
        ProjectState: {
          select: {
            id: true,
            title: true,
            slug: true,
            bgColor: true,
            textColor: true
          }
        },
        ProjectEnableStates: {
          select: {
            id: true,
            pId: true,
            pstateId: true,
          }
        },
        ProjectMembers: {
          select: {
            projectRole: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true
              }
            }
          },
          orderBy: {
            projectRole: 'asc'
          }
        },
        ProjectClient: {
          select: {
            clientId: true,
            isRepresentative: true,
            Client: {
              select: ClientDefaultAttributes
            }
          }
        },
        ProjectType: {
          select: {
            title: true,
            slug: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: {
            name: true,
            logo: true,
            uuid: true
          }
        },
        _count: {
          select: {
            Resources: {
              where: {
                isDeleted: false
              }
            }
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findBySlug(slug: string) {
    return this.prisma.project.findUnique({
      where: {
        slug: slug
      },
      include: {
        ProjectState: {
          select: {
            id: true,
            title: true,
            slug: true,
            bgColor: true,
            textColor: true
          }
        },
        ProjectHoldBy: {
          select: UserDefaultAttributes
        },
        ProjectMembers: {
          select: {
            projectRole: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true,
                email: true
              }
            }
          },
          orderBy: {
            projectRole: 'asc'
          }
        },
        ProjectClient: {
          select: {
            clientId: true,
            isRepresentative: true,
            Client: {
              select: ClientDefaultAttributes
            }
          }
        },
        ProjectType: {
          select: {
            title: true,
            slug: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: {
            name: true,
            logo: true,
            uuid: true
          }
        },
        Quotation: {
          where: {
            status: QuotationStatus.confirmed,
            isDeleted: false
          },
          select: {
            id: true,
            scopeOfWork: true,
            addedDate: true,
            QuotationMilestone: {
              select: {
                id: true,
                title: true,
                status: true
              },
              orderBy: {
                id: 'asc'
              }
            },
          },
          orderBy: {
            addedDate: 'asc'
          }
        },
        _count: {
          select: {
            Resources: {
              where: {
                isDeleted: false
              }
            },
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateDto: UpdateProjectDto) {

    const { clientRepresentativeId, projectInchargeId, supportEngineersId, clients, ...rest } = updateDto;
    let updateData = rest;
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate)
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate)
    }
    return this.prisma.project.update({
      data: rest,
      where: {
        id: id
      },
      include: {
        ProjectMembers: true,
        ProjectClient: true
      }
    })
      .then(async (data) => {

        if (projectInchargeId && projectInchargeId.length > 0) {
          let newUniqueUserIds = [];
          let existingUserWithDifferentProjectRole = [];
          projectInchargeId.forEach((inchargeId) => {
            if (newUniqueUserIds.includes(inchargeId) || existingUserWithDifferentProjectRole.includes(inchargeId) || supportEngineersId.includes(inchargeId)) {
              return
            }
            let esitingUser = data.ProjectMembers.find((ele) => ele.userId === inchargeId);
            if (esitingUser) {
              if (esitingUser.projectRole !== ProjectRole.projectIncharge) {
                existingUserWithDifferentProjectRole.push(esitingUser.userId)
              }
            } else {
              newUniqueUserIds.push(inchargeId)
            }
          })

          if (newUniqueUserIds.length > 0) {
            let dt: Array<Prisma.ProjectMembersCreateManyInput> = []
            newUniqueUserIds.forEach((ele) => {
              dt.push({
                projectId: data.id,
                userId: ele,
                projectRole: ProjectRole.projectIncharge
              })
            })

            await this.prisma.projectMembers.createMany({
              data: dt
            })
          }

          if (existingUserWithDifferentProjectRole.length > 0) {
            await this.prisma.projectMembers.updateMany({
              where: {
                userId: {
                  in: existingUserWithDifferentProjectRole
                }
              },
              data: {
                projectRole: ProjectRole.projectIncharge
              }
            })
          }
        }

        // if (projectInchargeId) {
        //   let esitingProjectIncharge = data.ProjectMembers.find((ele) => ele.userId === projectInchargeId);
        //   if (esitingProjectIncharge) {
        //     if (esitingProjectIncharge.projectRole !== ProjectRole.projectIncharge) {
        //       await this.prisma.projectMembers.update({
        //         where: {
        //           projectId_userId: {
        //             userId: projectInchargeId,
        //             projectId: data.id
        //           }
        //         },
        //         data: {
        //           projectRole: ProjectRole.projectIncharge
        //         }
        //       })
        //     }
        //   } else {
        //     await this.prisma.projectMembers.create({
        //       data: {
        //         userId: projectInchargeId,
        //         projectId: data.id,
        //         projectRole: ProjectRole.projectIncharge
        //       }
        //     })
        //   }
        // }

        if (supportEngineersId && supportEngineersId.length > 0) {
          let newUniqueUserIds = [];
          let existingUserWithDifferentProjectRole = [];
          supportEngineersId.forEach((engineerId) => {
            if (newUniqueUserIds.includes(engineerId) || existingUserWithDifferentProjectRole.includes(engineerId) || projectInchargeId.includes(engineerId)) {
              return
            }
            let esitingUser = data.ProjectMembers.find((ele) => ele.userId === engineerId);
            if (esitingUser) {
              if (esitingUser.projectRole !== ProjectRole.supportEngineers) {
                existingUserWithDifferentProjectRole.push(esitingUser.userId)
              }
            } else {
              newUniqueUserIds.push(engineerId)
            }
          })

          if (newUniqueUserIds.length > 0) {
            let dt: Array<Prisma.ProjectMembersCreateManyInput> = []
            newUniqueUserIds.forEach((ele) => {
              dt.push({
                projectId: data.id,
                userId: ele,
                projectRole: ProjectRole.supportEngineers
              })
            })

            await this.prisma.projectMembers.createMany({
              data: dt
            })
          }

          if (existingUserWithDifferentProjectRole.length > 0) {
            await this.prisma.projectMembers.updateMany({
              where: {
                userId: {
                  in: existingUserWithDifferentProjectRole
                }
              },
              data: {
                projectRole: ProjectRole.supportEngineers
              }
            })
          }
        }

        if (clientRepresentativeId) {
          let esitingClientRepresentative = data.ProjectClient.find((ele) => ele.clientId === clientRepresentativeId);
          if (esitingClientRepresentative) {
            if (esitingClientRepresentative.isRepresentative !== true) {
              await this.prisma.projectClient.update({
                where: {
                  projectId_clientId: {
                    clientId: clientRepresentativeId,
                    projectId: data.id
                  }
                },
                data: {
                  isRepresentative: true
                }
              })

              await this.prisma.projectClient.updateMany({
                where: {
                  clientId: {
                    not: clientRepresentativeId
                  },
                  projectId: data.id
                },
                data: {
                  isRepresentative: false
                }
              })
            }
          } else {
            await this.prisma.projectClient.create({
              data: {
                clientId: clientRepresentativeId,
                projectId: data.id,
                isRepresentative: true
              }
            })

            await this.prisma.projectClient.updateMany({
              where: {
                clientId: {
                  not: clientRepresentativeId
                },
                projectId: data.id
              },
              data: {
                isRepresentative: false
              }
            })
          }
        }

        if (clients && clients.length > 0) {
          let newUniqueUserIds = [];
          clients.forEach((clientId) => {
            if (newUniqueUserIds.includes(clientId) || clientId === clientRepresentativeId) {
              return
            }
            let esitingUser = data.ProjectClient.find((ele) => ele.clientId === clientId);
            if (!esitingUser) {
              newUniqueUserIds.push(clientId)
            }
          })

          if (newUniqueUserIds.length > 0) {
            let dt: Array<Prisma.ProjectClientCreateManyInput> = []
            newUniqueUserIds.forEach((ele) => {
              dt.push({
                projectId: data.id,
                clientId: ele,
                isRepresentative: false
              })
            })

            await this.prisma.projectClient.createMany({
              data: dt
            })
          }
        }

        if(updateDto.title){
          this.xeroQueue.add(XeroProcessNames.syncProject, {
            message: "Sync Project With Xero",
            data: data
          }, { removeOnComplete: true })
        }

        return data;
      })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  updateFiles(fileId: number, updateDto: UpdateProjectFiles) {
    return this.prisma.fileManagement.update({
      where: {
        id: fileId
      },
      data: updateDto
    })
  }

  async holdProject(id: number, updateDto: HoldProjectDto, user: AuthenticatedUser) {
    const recordData = await this.prisma.project.update({
      where: {
        id: id
      },
      data: {
        onHold: true,
        comment: updateDto.comment,
        modifiedDate: new Date(),
        projectHoldById: user.userId
      }
    })
  
    let emitterData = new NotificationEventDto({ recordId: recordData.id, moduleName: 'projectHoldNotification'});
    this.eventEmitter.emit('notification.send', emitterData);
  }

  async unholdProject(id: number, updateDto: UnholdProjectDto, user: AuthenticatedUser) {
    const recordData = await this.prisma.project.update({
      where: {
        id: id
      },
      data: {
        onHold: false,
        comment: (updateDto.comment) ? updateDto.comment : null,
        modifiedDate: new Date(),
        projectHoldById: user.userId
      }
    })

    let emitterData = new NotificationEventDto({ recordId: recordData.id, moduleName: 'projectResumeNotification'});
    this.eventEmitter.emit('notification.send', emitterData);
  }

  remove(id: number) {
    return this.prisma.project.update({
      data: {
        isDeleted: true
      },
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyConversationFilter(filters: ProjectChatFiltersDto, user: AuthenticatedUser, hasGlobalPermission: boolean = false) {
    let condition: Prisma.ProjectWhereInput = {
      isDeleted: false
    };

    if (hasGlobalPermission === false) {
      condition = {
        ...condition,
        ProjectMembers: {
          some: {
            userId: user.userId
          }
        }
      }
    }

    if (Object.entries(filters).length > 0) {

      if (filters.title) {
        if (condition.AND) {
          if (Array.isArray(condition.AND)) {
            condition.AND.push({
              OR: [
                {
                  title: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                },
                {
                  referenceNumber: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                }
              ]
            })
          } else {
            condition.AND = [
              condition.AND,
              {
                OR: [
                  {
                    title: {
                      contains: filters.title,
                      mode: 'insensitive'
                    }
                  },
                  {
                    referenceNumber: {
                      contains: filters.title,
                      mode: 'insensitive'
                    }
                  }
                ]
              }
            ]
          }
        } else {
          condition = {
            ...condition,
            AND: {
              OR: [
                {
                  title: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                },
                {
                  referenceNumber: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        }
      }
    }
    return condition;
  }


  applyFilters(filters: ProjectFiltersDto, user: AuthenticatedUser, hasGlobalPermission: boolean = false) {
    let condition: Prisma.ProjectWhereInput = {
      isDeleted: false
    };

    if (hasGlobalPermission === false) {
      condition = {
        ...condition,
        OR: [
          {
            ProjectMembers: {
              some: {
                userId: user.userId
              }
            }
          },
          {
            addedById: user.userId
          }
        ]
      }
    }

    if (Object.entries(filters).length > 0) {
      if (filters.slug) {
        condition = { ...condition, slug: filters.slug }
      }

      if (filters.ids) {
        let allIds = [];
        if (Array.isArray(filters.ids)) {
          allIds = filters.ids;
        } else {
          allIds = [filters.ids];
        }
        condition = { ...condition, id: { in: allIds } }
      }

      if (filters.quoteNumber) {
        condition = {
          ...condition,
          Quotation: {
            some: {
              quoteNumber: filters.quoteNumber
            }
          }
        }
      }

      if (filters.invoiceNumber) {
        condition = {
          ...condition,
          Invoice: {
            some: {
              invoiceNumber: filters.invoiceNumber
            }
          }
        }
      }

      if (filters.referenceNumber) {
        condition = {
          ...condition,
          referenceNumber: {
            contains: filters.referenceNumber,
            mode: 'insensitive'
          }
        }
      }

      if (filters.fromDate && filters.toDate) {
        if(condition.AND){
          if(Array.isArray(condition.AND)){
            condition.AND.push({
              addedDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            })
            
            condition.AND.push({
              addedDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            })
          }else{
            condition.AND = [
              condition.AND,
              {
                addedDate: {
                  gte: new Date(filters.fromDate + "T00:00:00")
                }
              },
              {
                addedDate: {
                  lte: new Date(filters.toDate + "T23:59:59")
                }
              }
            ]
          }
        }else{
          condition = {
            ...condition, AND: [
              {
                addedDate: {
                  gte: new Date(filters.fromDate + "T00:00:00")
                }
              },
              {
                addedDate: {
                  lte: new Date(filters.toDate + "T23:59:59")
                }
              }
            ]
          }
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

      if (filters.isClosed || filters?.isClosed === false) {
        condition = {
          ...condition,
          isClosed: filters.isClosed
        }
      }

      if (filters.onHold) {
        condition = {
          ...condition,
          onHold: filters.onHold
        }
      }

      if (filters.clientId) {
        condition = {
          ...condition,
          clientId: filters.clientId
        }
      }

      if (filters.delayed) {
        condition = {
          ...condition,
          isClosed: false,
        }
      }

      if (filters.projectStateId) {
        condition = {
          ...condition,
          projectStateId: filters.projectStateId
        }
      }

      if (filters.projectStateSlugs) {
        condition = {
          ...condition,
          ProjectState:{
            slug:{
              in: filters.projectStateSlugs
            }
          }
        }
      }

      if (filters.title) {
        let allIds = extractIds(filters.title);
        let referenceCondition = [];
        allIds.forEach((ele) => {
          referenceCondition.push(
            {
              referenceNumber: {
                contains: String(ele),
                mode: 'insensitive'
              }
            }
          )
        })
        
        if (condition.AND) {
          if (Array.isArray(condition.AND)) {
            condition.AND.push({
              OR: [
                ...referenceCondition,
                {
                  title: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                }
              ]
            })
          } else {
            condition.AND = [
              condition.AND,
              {
                OR: [
                  {
                    title: {
                      contains: filters.title,
                      mode: 'insensitive'
                    }
                  },
                  ...referenceCondition
                ]
              }
            ]
          }
        } else {
          condition = {
            ...condition,
            AND: {
              OR: [
                {
                  title: {
                    contains: filters.title,
                    mode: 'insensitive'
                  }
                },
                ...referenceCondition
              ]
            }
          }
        }
      }

      if (filters.userIds) {
        if (hasGlobalPermission === false) {
          if (condition.AND) {
            if (Array.isArray(condition.AND)) {
              condition.AND.push({
                ProjectMembers: {
                  some: {
                    userId: user.userId
                  }
                }
              })
              condition.AND.push({
                ProjectMembers: {
                  some: {
                    userId: {
                      in: filters.userIds
                    },
                    projectRole: (filters.projectRole) ? filters.projectRole : undefined
                  }
                }
              })
            } else {
              condition.AND = [
                condition.AND,
                {
                  ProjectMembers: {
                    some: {
                      userId: user.userId
                    }
                  }
                },
                {
                  ProjectMembers: {
                    some: {
                      userId: {
                        in: filters.userIds
                      },
                      projectRole: (filters.projectRole) ? filters.projectRole : undefined
                    }
                  }
                }
              ]
            }
          } else {
            condition = {
              ...condition,
              AND: [
                {
                  ProjectMembers: {
                    some: {
                      userId: user.userId
                    }
                  }
                },
                {
                  ProjectMembers: {
                    some: {
                      userId: {
                        in: filters.userIds
                      },
                      projectRole: (filters.projectRole) ? filters.projectRole : undefined
                    }
                  }
                }
              ]
            }
          }
        } else {
          condition = {
            ...condition,
            ProjectMembers: {
              some: {
                userId: {
                  in: filters.userIds
                },
                projectRole: (filters.projectRole) ? filters.projectRole : undefined
              },
            }
          }
        }
      }

    }
    return condition;
  }

  countProject(filters: Prisma.ProjectWhereInput) {
    return this.prisma.project.count({
      where: filters
    })
  }

  countProjectResources(filters: Prisma.FileManagementWhereInput) {
    return this.prisma.fileManagement.count({
      where: filters
    })
  }

  countProjectNotes(filters: Prisma.ProjectConversationWhereInput) {
    return this.prisma.projectConversation.count({
      where: filters
    })
  }

  countFileShareLogs(filters: Prisma.FileshareLogsWhereInput) {
    return this.prisma.fileshareLogs.count({
      where: filters
    })
  }

  async handlePropertyFiles(uploadPropertyFiles: UploadProjectFiles, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let property = await this.prisma.project.findUnique({
      where: {
        id: uploadPropertyFiles.projectId
      }
    })

    if (!property) {
      throw new NotFoundException({ message: "Property with the provided propertyId not Found", statusCode: 400 })
    }
    let insertedIds = []
    let insertData: Array<Prisma.FileManagementCreateInput> = files.map((ele, index) => {
      let uuid = generateUUID();
      insertedIds.push(uuid);
      let newRecord: Prisma.FileManagementUncheckedCreateInput = {
        uuid: uuid,
        documentType: uploadPropertyFiles.documentType,
        title: uploadPropertyFiles.title ? uploadPropertyFiles.title : getEnumKeyByValue(ProjectDocumentsTypes, uploadPropertyFiles.documentType),
        name: ele.originalname,
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        isTemp: false,
        status: FileStatus.Verified,
        addedById: user.userId,
        visibility: FileVisibility.organization,
        projectId: uploadPropertyFiles.projectId,
        fileSize: ele.size / 1024 //in KB
      }
      return newRecord;
    });

    if (insertData.length > 0) {
      await this.prisma.fileManagement.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })
      return this.prisma.fileManagement.findMany({
        where: {
          uuid: {
            in: insertedIds
          }
        },
        select: {
          id: true,
          uuid: true,
          file: true,
          name: true,
          isTemp: true,
          projectId: true,
          path: true
        }
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return []
    }
  }

  async handleConversationFiles(projectId: number, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let property = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    })

    if (!property) {
      throw new NotFoundException({ message: "Property with the provided propertyId not Found", statusCode: 400 })
    }

    let conversationData = await this.prisma.projectConversation.create({
      data: {
        message: "",
        addedDate: new Date(),
        projectId: projectId,
        userId: user.userId
      }
    })

    let insertData: Array<Prisma.FileManagementCreateInput> = files.map((ele, index) => {
      let newRecord: Prisma.FileManagementUncheckedCreateInput = {
        documentType: ProjectDocumentsTypes.other,
        title: getEnumKeyByValue(ProjectDocumentsTypes, ProjectDocumentsTypes.other),
        name: ele.originalname,
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        isTemp: false,
        status: FileStatus.Verified,
        addedById: user.userId,
        visibility: FileVisibility.organization,
        projectId: projectId,
        addedDate: new Date(),
        projectConversationId: conversationData.id,
        fileSize: ele.size / 1024 //in KB
      }
      return newRecord;
    });

    if (insertData.length > 0) {
      await this.prisma.fileManagement.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

      return this.prisma.projectConversation.findMany({
        where: {
          id: conversationData.id
        },
        include: {
          Media: {
            select: {
              id: true,
              uuid: true,
              file: true,
              name: true,
              path: true,
              fileType: true,
              addedDate: true,
              AddedBy: {
                select: UserDefaultAttributes
              }
            }
          }
        }
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return []
    }
  }

  removeProjectMember(removeProjectMember: RemoveProjectMember) {
    return this.prisma.projectMembers.deleteMany({
      where: {
        projectId: removeProjectMember.projectId,
        userId: removeProjectMember.userId
      }
    })
  }

  removeProjectClient(removeProjectClient: RemoveProjectClient) {
    return this.prisma.projectClient.deleteMany({
      where: {
        projectId: removeProjectClient.projectId,
        clientId: removeProjectClient.clientId
      }
    })
  }

  async updateProjectMember(updateProjectMember: UpdateProjectMember) {
    const { projectId, projectInchargeId, clientRepresentativeId, supportEngineersId, clients } = updateProjectMember;
    let data = await this.prisma.project.findFirst({
      where: {
        id: projectId
      },
      include: {
        ProjectMembers: true,
        ProjectClient: true
      }
    })

    if (!data) {
      throw {
        message: "No Project Found with the provided ID",
        statusCode: 404
      }
    }

    if (projectInchargeId && projectInchargeId.length > 0) {
      let newUniqueUserIds = [];
      let existingUserWithDifferentProjectRole = [];
      projectInchargeId.forEach((inchargeId) => {
        if (newUniqueUserIds.includes(inchargeId) || existingUserWithDifferentProjectRole.includes(inchargeId)) {
          return
        }
        let esitingUser = data.ProjectMembers.find((ele) => ele.userId === inchargeId);
        if (esitingUser) {
          if (esitingUser.projectRole !== ProjectRole.projectIncharge) {
            existingUserWithDifferentProjectRole.push(esitingUser.userId)
          }
        } else {
          newUniqueUserIds.push(inchargeId)
        }
      })

      if (newUniqueUserIds.length > 0) {
        let dt: Array<Prisma.ProjectMembersCreateManyInput> = []
        newUniqueUserIds.forEach((ele) => {
          dt.push({
            projectId: data.id,
            userId: ele,
            projectRole: ProjectRole.projectIncharge
          })
        })

        await this.prisma.projectMembers.createMany({
          data: dt
        })

        let emitterData = new NotificationEventDto({ recordId: data.id, moduleName: 'projectMembersAddition', additionalData: dt });
        this.eventEmitter.emit('notification.send', emitterData);
      }

      if (existingUserWithDifferentProjectRole.length > 0) {
        await this.prisma.projectMembers.updateMany({
          where: {
            userId: {
              in: existingUserWithDifferentProjectRole
            }
          },
          data: {
            projectRole: ProjectRole.projectIncharge
          }
        })
      }
    }

    // if (projectInchargeId) {
    //   let esitingProjectIncharge = data.ProjectMembers.find((ele) => ele.userId === projectInchargeId);
    //   if (esitingProjectIncharge) {
    //     if (esitingProjectIncharge.projectRole !== ProjectRole.projectIncharge) {
    //       let newIncharge = await this.prisma.projectMembers.update({
    //         where: {
    //           projectId_userId: {
    //             userId: projectInchargeId,
    //             projectId: data.id
    //           }
    //         },
    //         data: {
    //           projectRole: ProjectRole.projectIncharge
    //         }
    //       })

    //       let emitterData = new NotificationEventDto({ recordId: data.id, moduleName: 'projectMembersAddition', additionalData: newIncharge });
    //       this.eventEmitter.emit('notification.send', emitterData);

    //     }
    //   } else {
    //     let newIncharge = await this.prisma.projectMembers.create({
    //       data: {
    //         userId: projectInchargeId,
    //         projectId: data.id,
    //         projectRole: ProjectRole.projectIncharge
    //       }
    //     })

    //     let emitterData = new NotificationEventDto({ recordId: data.id, moduleName: 'projectMembersAddition', additionalData: newIncharge });
    //     this.eventEmitter.emit('notification.send', emitterData);
    //   }
    // }

    if (supportEngineersId && supportEngineersId.length > 0) {
      let newUniqueUserIds = [];
      let existingUserWithDifferentProjectRole = [];
      supportEngineersId.forEach((engineerId) => {
        if (newUniqueUserIds.includes(engineerId) || existingUserWithDifferentProjectRole.includes(engineerId)) {
          return
        }
        let esitingUser = data.ProjectMembers.find((ele) => ele.userId === engineerId);
        if (esitingUser) {
          if (esitingUser.projectRole !== ProjectRole.supportEngineers) {
            existingUserWithDifferentProjectRole.push(esitingUser.userId)
          }
        } else {
          newUniqueUserIds.push(engineerId)
        }
      })

      if (newUniqueUserIds.length > 0) {
        let dt: Array<Prisma.ProjectMembersCreateManyInput> = []
        newUniqueUserIds.forEach((ele) => {
          dt.push({
            projectId: data.id,
            userId: ele,
            projectRole: ProjectRole.supportEngineers
          })
        })

        await this.prisma.projectMembers.createMany({
          data: dt
        })

        let emitterData = new NotificationEventDto({ recordId: data.id, moduleName: 'projectMembersAddition', additionalData: dt });
        this.eventEmitter.emit('notification.send', emitterData);
      }

      if (existingUserWithDifferentProjectRole.length > 0) {
        await this.prisma.projectMembers.updateMany({
          where: {
            userId: {
              in: existingUserWithDifferentProjectRole
            }
          },
          data: {
            projectRole: ProjectRole.supportEngineers
          }
        })
      }
    }

    if (clientRepresentativeId) {
      let esitingClientRepresentative = data.ProjectClient.find((ele) => ele.clientId === clientRepresentativeId);
      if (esitingClientRepresentative) {
        if (esitingClientRepresentative.isRepresentative !== true) {
          await this.prisma.projectClient.update({
            where: {
              projectId_clientId: {
                clientId: clientRepresentativeId,
                projectId: data.id
              }
            },
            data: {
              isRepresentative: true
            }
          })

          await this.prisma.projectClient.updateMany({
            where: {
              clientId: {
                not: clientRepresentativeId
              },
              projectId: data.id
            },
            data: {
              isRepresentative: false
            }
          })
        }
      } else {
        await this.prisma.projectClient.create({
          data: {
            clientId: clientRepresentativeId,
            projectId: data.id,
            isRepresentative: true
          }
        })

        await this.prisma.projectClient.updateMany({
          where: {
            clientId: {
              not: clientRepresentativeId
            },
            projectId: data.id
          },
          data: {
            isRepresentative: false
          }
        })
      }
    }

    if (clients && clients.length > 0) {
      let newUniqueUserIds = [];
      clients.forEach((clientId) => {
        if (newUniqueUserIds.includes(clientId) || clientId === clientRepresentativeId) {
          return
        }
        let esitingUser = data.ProjectClient.find((ele) => ele.clientId === clientId);
        if (!esitingUser) {
          newUniqueUserIds.push(clientId)
        }
      })

      if (newUniqueUserIds.length > 0) {
        let dt: Array<Prisma.ProjectClientCreateManyInput> = []
        newUniqueUserIds.forEach((ele) => {
          dt.push({
            projectId: data.id,
            clientId: ele,
            isRepresentative: false
          })
        })

        await this.prisma.projectClient.createMany({
          data: dt
        })
      }
    }
  }

  

  async updateProjectStatus(updateProjectStatus: UpdateProjectStatus, user: AuthenticatedUser) {
    let projectStateData = await this.prisma.projectState.findFirst({
      where: {
        id: updateProjectStatus.projectStateId,
        isDeleted: false,
        isPublished: true
      }
    })
    if (!projectStateData) {
      throw {
        message: "This status is not available or may have been removed by the administrator",
        statusCode: 404
      }
    }

    let updateData: Prisma.ProjectUncheckedUpdateInput = {
      projectStateId: projectStateData.id,
      isClosed: projectStateData.shouldCloseProject === true ? true : false,
      modifiedDate: new Date(),
      modifiedById: user.userId
    }

    return this.prisma.project.update({
      where: {
        id: updateProjectStatus.projectId,
      },
      data: updateData
    })
  }

  // addProjectStates(id: number, projectStateIds: Array<number>) {
  //   let insertData = projectStateIds.map((key) => { return { pId: id, pstateId: key} });
  //   return this.prisma.projectEnableStates.createMany({
  //     data: insertData
  //   }).catch((err: PrismaClientKnownRequestError) => {
  //     this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
  //     let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
  //     throw errorResponse;
  //   })
  // }

  async addProjectStates(id: number, projectStateIds: Array<number>) {
    let insertData = projectStateIds.map((key) => ({ pId: id, pstateId: key }));
    
    try {
      let result = await this.prisma.projectEnableStates.createMany({
        data: insertData
      });
      console.log('Insert result:', result);
      return result;
    } catch (err) {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} };
      throw errorResponse;
    }
  }
  

  // addProjectStates(id: number, projectStateIds: number[]) {
  //   const insertData = projectStateIds.map((key) => ({
  //     pId: id,
  //     pstateId: key,
  //   }));
  
  //   return this.prisma.projectEnableStates.createMany({
  //     data: insertData,
  //     skipDuplicates: true,
  //   }).catch((err: PrismaClientKnownRequestError) => {
  //     this.logger.error(`Error on ${this.constructor.name}: ${err.message}`);
  //     const errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} };
  //     throw errorResponse;
  //   });
  // }

  findProjectStatesByStateIds(pId: number, projectStateIds: number[]) {
    let condition: Prisma.ProjectEnableStatesScalarWhereInput = { pId: pId };
    condition = { ...condition, pstateId: { in: projectStateIds } }
    return this.prisma.projectEnableStates.findMany({
      where: condition
    })
  }

  // removeProjectStatesByStateIds(pId: number, projectStateIds: number[]) {
  //   let condition: Prisma.ProjectEnableStatesScalarWhereInput = { pId: pId };
  //   condition = { ...condition, pstateId: { in: projectStateIds } }
  //   return this.prisma.projectEnableStates.deleteMany({
  //     where: condition
  //   })
  // }

  removeProjectStatesByStateIds(pId: number, projectStateIds: number[]) {
    return this.prisma.projectEnableStates.deleteMany({
      where: {
        pId: pId,
        pstateId: {
          in: projectStateIds // Ensure this is a flat array of numbers
        }
      }
    });
}


  removeProjectFiles(fileId: number, user: AuthenticatedUser) {
    return this.prisma.fileManagement.update({
      where: {
        id: fileId
      },
      data: {
        isDeleted: true,
        deletedDate: new Date(),
        deletedById: user.userId
      }
    })
  }

  applyResourcesFilters(filters: ProjectResourcesFiltersDto) {
    let condition: Prisma.FileManagementWhereInput = {
      isDeleted: false
    }
    if (filters && Object.entries(filters).length > 0) {
      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              addedDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              addedDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

      if (filters.fileName) {
        condition = {
          ...condition,
          AND: {
            OR: [
              {
                file: {
                  contains: filters.fileName,
                  mode: 'insensitive'
                }
              },
              {
                title: {
                  contains: filters.fileName,
                  mode: 'insensitive'
                }
              },
              {
                name: {
                  contains: filters.fileName,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: filters.fileName,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      }

      if (filters.fileType) {
        condition = {
          ...condition,
          fileType: filters.fileType
        }
      }

      if (filters.sharedToClient) {
        condition = {
          ...condition,
          FileshareLogs: {
            some:{}
          }
        }
      }

      if (filters.projectDocumentsTypes) {
        condition = {
          ...condition,
          documentType: filters.projectDocumentsTypes
        }
      }

      if (filters.projectId) {
        condition = {
          ...condition,
          projectId: filters.projectId
        }
      }
    }

    return condition;
  }

  applyNotesFilters(filters: ProjectCommentAndNotesFiltersDto) {
    let condition: Prisma.ProjectConversationWhereInput = {
      isDeleted: false,
      AND: {
        OR: [
          {
            message: {
              not: ""
            }
          },
          {
            Media: {
              some: {
                isDeleted: false
              }
            }
          }
        ]
      }
    };
    if (filters && Object.entries(filters).length > 0) {
      if (filters.message) {
        condition = {
          ...condition,
          message: {
            contains: filters.message,
            mode: 'insensitive'
          }
        }
      }
      if (filters.projectId) {
        condition = {
          ...condition,
          projectId: filters.projectId
        }
      }
    }
    return condition
  }

  findAllResources(filters: Prisma.FileManagementWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.fileManagement.findMany({
      where: filters,
      skip: skip,
      take: take,
      select: {
        id: true,
        uuid: true,
        file: true,
        name: true,
        path: true,
        title: true,
        fileType: true,
        addedDate: true,
        documentType: true,
        AddedBy: {
          select: UserDefaultAttributes
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }


  findProjectNotes(filters: Prisma.ProjectConversationWhereInput, pagination: ProjectNotePaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let cursor = undefined;
    if (pagination.before) {
      cursor = {
        id: pagination.before
      }
    }
    let records = this.prisma.projectConversation.findMany({
      where: filters,
      skip: (pagination.before) ? 1 : skip,
      take: take,
      cursor: (pagination.before) ? cursor : undefined,
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            profile: true,
            id: true,
            uuid: true,
            email: true
          }
        },
        Media: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            uuid: true,
            file: true,
            name: true,
            path: true,
            fileType: true,
            addedDate: true,
            AddedBy: {
              select: UserDefaultAttributes
            }
          }
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
    return records;
  }

  async createProjectNote(createDto: CreateProjectNoteDto, user: AuthenticatedUser) {
    const { message, ...rest } = createDto;
    let formattedMessage = message.replace(/\n{3,}/g, '\n\n').trim();
    let conversation = await this.prisma.projectConversation.create({
      data: {
        ...rest,
        message: formattedMessage,
        userId: user.userId
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            profile: true,
            id: true,
            uuid: true,
            email: true
          }
        },
        Project:{
          select: {
            ...ProjectDefaultAttributes,
            onHold: true,
            ProjectMembers:{
              where:{
                User:{
                  isDeleted: false
                }
              },
              include:{
                User:{
                  select: UserDefaultAttributes
                }
              }
            },
          }
        },
        Media: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            uuid: true,
            file: true,
            name: true,
            path: true,
            fileType: true,
            addedDate: true,
            AddedBy: {
              select: UserDefaultAttributes
            }
          }
        }
      },
    })

    this.chatGateway.sendMessage(conversation, user.userId);
    this.readAllConversation(conversation.projectId, user);
    return conversation;
  }

  async removeNote(noteId: number) {

    let currentTime = new Date();
    let recordData = await this.prisma.projectConversation.findUniqueOrThrow({
      where: {
        id: noteId
      }
    })

    let timeDifference = Math.abs(getMinutesDiff(recordData.addedDate, currentTime));
    if (timeDifference > 15) { //don't allow to delete message after 15 minutes
      throw {
        message: "You cannot delete conversation anymore. Deletions are restricted to 15 minutes of posting a message.",
        statusCode: 400
      }
    }

    return this.prisma.projectConversation.update({
      where: {
        id: noteId
      },
      data: {
        isDeleted: true,
        Media: {
          updateMany: {
            where: {
              projectConversationId: noteId
            },
            data: {
              isDeleted: true
            }
          }
        }
      }
    })
  }

  async removeNoteMedia(mediaId: number) {

    let currentTime = new Date();
    let recordData = await this.prisma.fileManagement.findUniqueOrThrow({
      where: {
        id: mediaId
      }
    })

    let timeDifference = Math.abs(getMinutesDiff(recordData.addedDate, currentTime));
    if (timeDifference > 15) { //don't allow to delete message after 15 minutes
      throw {
        message: "You cannot delete conversation anymore. Deletions are restricted to 15 minutes of posting a message.",
        statusCode: 400
      }
    }

    return this.prisma.fileManagement.update({
      where: {
        id: mediaId
      },
      data: {
        isDeleted: true
      }
    })
  }

  async readAllConversation(projectId: number, user: AuthenticatedUser) {
    let notReadMessages = await this.prisma.projectConversation.findMany({
      where: {
        AND: {
          isDeleted: false,
          projectId: projectId,
          userId: {
            not: user.userId
          },
          OR: [
            {
              ReadLog: {
                some: {
                  userId: user.userId,
                  read: false
                }
              }
            },
            {
              ReadLog: {
                none: {
                  userId: user.userId
                }
              }
            }
          ]
        }
      },
      select: {
        id: true
      }
    })

    if(notReadMessages.length === 0){
      return;
    }

    this.logger.log(`Marking ${notReadMessages.length} messages as read`)
    const MAX_CONCURRENT_OPERATIONS = 10;
    await BluebirdPromise.map(notReadMessages, async (msg) => {
      try {
        await this.prisma.projectConversationReadLog.upsert({
          where: {
            conversationId_userId: {
              conversationId: msg.id,
              userId: user.userId
            },
          },
          create: {
            conversationId: msg.id,
            userId: user.userId,
            read: true
          },
          update: {
            read: true
          }
        })
      } catch (err) {
        this.logger.error("Some error marking message as read", err.message)
      }
    }, { concurrency: MAX_CONCURRENT_OPERATIONS });
  }

  async shareFilesToClient(shareFiles: ShareFilesToClient, user: AuthenticatedUser){
    let allFilesToShare = await this.prisma.fileManagement.findMany({
      where:{
        projectId: shareFiles.projectId,
        id: {
          in: shareFiles.fileIds
        }
      }
    })

    let projectData = await this.prisma.project.findUniqueOrThrow({
      where:{
        id: shareFiles.projectId
      },
      include:{
        Client: {
          select: ClientDefaultAttributes
        },
        ProjectClient: {
          include: {
            Client: {
              select: ClientDefaultAttributes
            }
          }
        }
      }
    })

    if(allFilesToShare.length === 0){
      throw {
        message: "FNo Files Found for the given Project and File Ids"
      }
    }

    let lastBatch = await this.prisma.fileshareLogs.aggregate({
      _max:{
        batchNumber: true
      }
    })
    let newBatch = (lastBatch && lastBatch._max.batchNumber) ? lastBatch._max.batchNumber + 1 : 1; 
    let allRecords : Prisma.FileshareLogsUncheckedCreateInput[] = [];
    allFilesToShare.forEach((ele) => {
      let t : Prisma.FileshareLogsUncheckedCreateInput = {
        clientId: projectData.clientId,
        projectId: ele.projectId,
        fileId: ele.id,
        addedDate: new Date(),
        sharedById: user.userId,
        batchNumber: newBatch
      }
      allRecords.push(t);
    })

    await this.prisma.fileshareLogs.createMany({
      data: allRecords
    })

    if(shareFiles.shareInEmail){
      this.mailService.shareProjectFilesToClient(projectData, allFilesToShare, user);
    }
  }

  async findSharedFilesToClient(projectId: number){
    return this.prisma.fileshareLogs.findMany({
      where:{
        projectId: projectId,
      }
    })
  }

  async prepareFinanceReport(projectId: number, projectEstimate: number){
    let invoicedAmount = 0;
    let timeAndExpenses = 0;
    let invoiceTransaction = this.prisma.transactions.aggregate({
      where:{
        Invoice: {
          InvoiceItems:{
            some:{
              Account:{
                showInExpenseClaims: false
              }
            }
          }
        },
        isDeleted: false,
        projectId: projectId
      },
      _sum:{amount: true}
    })

    // let expensesTransaction = this.prisma.transactions.aggregate({
    //   where:{
    //     authorityId: {not: null},
    //     isDeleted: false,
    //     projectId: projectId
    //   },
    //   _sum:{amount: true}
    // })

    let expensesTransaction = this.prisma.transactions.aggregate({
      where:{
        Invoice: {
          InvoiceItems:{
            some:{
              Account:{
                showInExpenseClaims: true
              }
            }
          }
        },
        isDeleted: false,
        projectId: projectId
      },
      _sum:{amount: true}
    })

    let pendingInvoicesCount = this.prisma.invoice.count({
      where:{
        status: {
          in: [InvoiceStatus.sent, InvoiceStatus.generated]
        },
        projectId: projectId,
        isDeleted: false
      }
    })

    let expensesToCollectCount = this.prisma.transactions.count({
      where:{
        status: {
          in: [TransactionStatus.sent_to_client, TransactionStatus.pending_payment]
        },
        authorityId: {not: null},
        isDeleted: false,
        projectId: projectId
      }
    })

    let after30Days = new Date();
    after30Days.setDate(after30Days.getDate() + 30);
    let permitExpiringCount = this.prisma.permit.count({
      where:{
        isDeleted: false,
        projectId: projectId,
        expiryDate:{
          lte: after30Days,
          gte: new Date()
        },
      }
    })

    const [invoicePayments, expensePayments, invoiceToCollectPayment, governmentFeesToCollect, permitExpiring] = await Promise.all([invoiceTransaction, expensesTransaction, pendingInvoicesCount, expensesToCollectCount, permitExpiringCount]);
    invoicedAmount = invoicePayments._sum.amount;
    timeAndExpenses = expensePayments._sum.amount | 0;
    let invoicedPercentage = (invoicedAmount / projectEstimate) * 100;
    return {
      projectEstimate: projectEstimate,
      invoicedAmount: invoicedAmount,
      invoicedPercentage: invoicedPercentage,
      timeAndExpensesAmount: timeAndExpenses,
      toBeInvoicedAmount: projectEstimate - invoicedAmount,
      toBeInvoicedAmountPercentage : 100 - invoicedPercentage,
      invoiceToCollectPayment: invoiceToCollectPayment,
      governmentFeesToCollect: governmentFeesToCollect,
      permitExpiringThisMonth: permitExpiring
    }
  }

  async findSharedFiles(projectId: number){
    // let uniqueBatchNumbers = await this.prisma.fileshareLogs.groupBy({
    //   by: ['batchNumber'],
    //   where:{
    //     projectId: projectId
    //   },
    //   orderBy:{
    //     batchNumber: 'asc'
    //   },
    // })

    let query = `SELECT "batchNumber", DATE("addedDate") as "sharedDate"
    FROM "FileshareLogs"
    WHERE "projectId" = '${projectId}'
    GROUP BY "batchNumber", "sharedDate"
    ORDER BY "batchNumber" ASC
    ;`

    const uniqueBatchNumbers: Array<{ batchNumber: number, sharedDate: Date }> = await this.prisma.$queryRawUnsafe(query);
    const filesShared = await Promise.all(
      uniqueBatchNumbers.map(async (entry) => {
        const files = await this.prisma.fileManagement.findMany({
          where: {
            projectId: projectId,
            FileshareLogs:{
              some:{
                batchNumber: entry.batchNumber
              }
            }
          },
          select: {
            id: true,
            uuid: true,
            file: true,
            name: true,
            path: true,
            title: true,
            fileType: true,
            addedDate: true,
            documentType: true,
            AddedBy: {
              select: UserDefaultAttributes
            },
          },
          orderBy: {
            id: 'desc'
          },
        });
    
        return {
          batchNumber: entry.batchNumber,
          sharedDate: (files.length > 0) ? files[0].addedDate : undefined,
          sharedFiles: files,
        };
      })
    );

    return filesShared;
  }


  

}


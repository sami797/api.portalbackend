import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { NotificationEventDto, notificationFileUploadPath } from '../dto/notification.dto';
import { QuotationPermissionSet } from 'src/modules/quotation/quotation.permissions';
import { InvoicePermissionSet } from 'src/modules/invoice/invoice.permissions';
import { Departments, HOSTS, InvoiceStatus, LeadsStatus, ProjectRole, QuotationStatus, TransactionStatus } from 'src/config/constants';
import { UserDefaultAttributes } from 'src/modules/user/dto/user.dto';
import { ClientDefaultAttributes } from 'src/modules/client/dto/client.dto';
import { MailService } from 'src/mail/mail.service';
import { LeadsPermissionSet } from 'src/modules/leads/leads.permissions';
import { ProjectPermissionSet } from 'src/modules/project/project.permissions';
import { OrganizationDefaultAttributes } from 'src/modules/organization/dto/organization.dto';
import { Client, Organization, Prisma, Project, ProjectMembers, ProjectState, User } from '@prisma/client';
import { camelToSnakeCase, getEnumKeyByEnumValue, toSentenceCase } from 'src/helpers/common';
import { TransactionPermissionSet } from 'src/modules/transactions/transactions.permissions';

@Injectable()
export class NotificationProcessorService {

  private readonly logger = new Logger(NotificationProcessorService.name);
  activeJob: NotificationEventDto = null;
  jobQueue: Array<NotificationEventDto> = [];
  isProcessing = false;

  constructor(private prisma: PrismaService, private readonly mailService: MailService) { }

  async sendNotification(eventData: NotificationEventDto) {
    try {
      switch (eventData.moduleName) {
        case 'invoice': await this.sendInvoiceNotification(eventData.recordId); break;
        case 'reimbursement': await this.sendReimbursementNotification(eventData.recordId); break;
        case 'newProject': await this.sendNewProjectNotification(eventData.recordId); break;
        case 'projectMembersAddition': await this.sendProjectMembersChangeNotification(eventData.recordId, eventData.additionalData); break;
        case 'quotationApproved': await this.sendQuotationNotification(eventData.recordId); break;
        case 'milestoneCompleted': await this.sendMilestoneCompletedNotification(eventData.recordId); break;
        case 'enquiryConfirmed': await this.sendEnquiryConfirmedNotification(eventData.recordId); break;
        case 'projectHoldNotification': await this.sendProjectHoldNotification(eventData.recordId); break;
        case 'projectResumeNotification': await this.sendProjectResumeNotification(eventData.recordId); break;
        case 'dailyNotification': await this.sendDailyNotification(); break;
      }
    } catch (err) {
      this.logger.log("Error while sending notificaiton. Event:", eventData, " Message:", err.message);
    } finally {
      return this.handleNext();
    }
  }

  handleNext() {
    if (this.jobQueue.length > 0) {
      let activeJob = this.jobQueue.shift();
      this.activeJob = activeJob;
      console.log("Starting Sending Notification", activeJob);
      this.sendNotification(activeJob);
    } else {
      console.log("No more notifications to send in the queue, clearing the available resources");
      this.isProcessing = false;
    }
  }

  async sendInvoiceNotification(recordId: number) {

    return this.handleNext();
  }

  async sendProjectHoldNotification(recordId: number) {
    try {
      let recordData = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: recordId
        },
        select: {
          id: true,
          referenceNumber: true,
          slug: true,
          title: true,
          onHold: true,
          comment: true,
          ProjectState: {
            select: {
              title: true,
              slug: true,
              id: true
            }
          },
          Client: {
            select: ClientDefaultAttributes
          },
          SubmissionBy: {
            select: OrganizationDefaultAttributes
          }
        }
      })

      this.logger.log("Find Users who can receive project Notification");
      let subscribedUsers = await this.findProjectUsers(recordId);
      let emailSubscribers = await this.findProjectUsers(recordId, true);

      this.logger.log("Creating Project Hold Notification");
      await this.prisma.notification.create({
        data: {
          message: `Project has been temporarily placed on hold - ${recordData.referenceNumber} | ${recordData.title}.`,
          link: HOSTS.defaultAdminDomain + "/projects/" + recordData.slug + "?id=" + recordData?.id,
          linkLabel: "View Project",
          icon: notificationFileUploadPath + "/common/inventory.png",
          type: 'user',
          Subscribers: {
            createMany: {
              data: subscribedUsers.map((ele) => {
                return {
                  userId: ele.id,
                  read: false
                }
              })
            }
          }
        }
      })

      if (emailSubscribers.length > 0) {
        let allUserEmails = emailSubscribers.map((ele) => ele.email);
        this.logger.log("Sending Project Resumed Notification to " + allUserEmails.join(", "));
        await this.mailService.sendProjectHoldNotification(recordData, recordData.Client, recordData.SubmissionBy, allUserEmails);
      }

    } catch (err) {
      this.logger.error("Some error while sending project hold notification", err.message);
    } finally {
      return this.handleNext();
    }
  }

  async sendProjectResumeNotification(recordId: number) {
    try {

      let recordData = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: recordId
        },
        select: {
          id: true,
          referenceNumber: true,
          slug: true,
          title: true,
          onHold: true,
          comment: true,
          ProjectState: {
            select: {
              title: true,
              slug: true,
              id: true
            }
          },
          Client: {
            select: ClientDefaultAttributes
          },
          SubmissionBy: {
            select: OrganizationDefaultAttributes
          }
        }
      })

      this.logger.log("Find Users who can receive project Notification");
      let subscribedUsers = await this.findProjectUsers(recordId);
      let emailSubscribers = await this.findProjectUsers(recordId, true);

      this.logger.log("Creating Project Resumed Notification");
      await this.prisma.notification.create({
        data: {
          message: `Project Resumed - ${recordData.referenceNumber} | ${recordData.title}.`,
          link: HOSTS.defaultAdminDomain + "/projects/" + recordData.slug + "?id=" + recordData?.id,
          linkLabel: "View Project",
          icon: notificationFileUploadPath + "/common/inventory.png",
          type: 'user',
          Subscribers: {
            createMany: {
              data: subscribedUsers.map((ele) => {
                return {
                  userId: ele.id,
                  read: false
                }
              })
            }
          }
        }
      })

      if (emailSubscribers.length > 0) {
        let allUserEmails = emailSubscribers.map((ele) => ele.email);
        this.logger.log("Sending Project Resumed Notification to " + allUserEmails.join(", "));
        await this.mailService.sendProjectResumedNotification(recordData, recordData.Client, recordData.SubmissionBy, allUserEmails);
      }

    } catch (err) {
      this.logger.error("Some error while sending project resumed notification", err.message);
    } finally {
      return this.handleNext();
    }
  }

  async sendReimbursementNotification(recordId: number) {
    try {

    } catch (err) {
      this.logger.error("Some error while sending reimbursement notification", err.message);
    } finally {
      return this.handleNext();
    }
  }

  async sendNewProjectNotification(recordId: number) {
    let recordData = await this.prisma.project.findUniqueOrThrow({
      where: {
        id: recordId
      },
      select: {
        id: true,
        referenceNumber: true,
        slug: true,
        title: true,
        onHold: true,
        comment: true,
        ProjectState: {
          select: {
            title: true,
            slug: true,
            id: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: OrganizationDefaultAttributes
        }
      }
    })

    this.logger.log("Find Users who can receive new project Notification");
    let subscribedUsers = await this.findUsersBasedOnPermission(ProjectPermissionSet.REAL_ALL_PROJECT);
    let emailSubscribers = await this.findUsersBasedOnPermission(ProjectPermissionSet.REAL_ALL_PROJECT, true);

    this.logger.log("Creating New Project Notification");
    await this.prisma.notification.create({
      data: {
        message: `New project has been added to the system. ${recordData.referenceNumber} | ${recordData.title}.`,
        link: HOSTS.defaultAdminDomain + "/projects/" + recordData.slug + "?id=" + recordData?.id,
        linkLabel: "View Project",
        icon: notificationFileUploadPath + "/common/inventory.png",
        type: 'user',
        Subscribers: {
          createMany: {
            data: subscribedUsers.map((ele) => {
              return {
                userId: ele.id,
                read: false
              }
            })
          }
        }
      }
    })

    if (emailSubscribers.length > 0) {
      let allUserEmails = emailSubscribers.map((ele) => ele.email);
      this.logger.log("Sending New Project Email Notification to " + allUserEmails.join(", "));
      await this.mailService.sendNewProjectNotification(recordData, recordData.Client, recordData.SubmissionBy, allUserEmails);
    }

    return this.handleNext();
  }

  async sendProjectMembersChangeNotification(recordId: number, additionalData: any) {

    let recordData = await this.prisma.project.findUniqueOrThrow({
      where: {
        id: recordId
      },
      select: {
        id: true,
        referenceNumber: true,
        slug: true,
        title: true,
        onHold: true,
        comment: true,
        ProjectState: {
          select: {
            title: true,
            slug: true,
            id: true
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        SubmissionBy: {
          select: OrganizationDefaultAttributes
        }
      }
    })

    let allMembers = additionalData as ProjectMembers | ProjectMembers[];
    if (Array.isArray(allMembers)) {
      allMembers.forEach((ele) => {
        if (ele.projectId && ele.projectRole && ele.userId) {
          this.sendEachProjectMembersChangeNotification(recordData, ele);
        }
      })
    } else {
      if (allMembers.projectId && allMembers.projectRole && allMembers.userId) {
        this.sendEachProjectMembersChangeNotification(recordData, allMembers);
      }
    }

  }
  async sendEachProjectMembersChangeNotification(recordData: Partial<Project> & { ProjectState: Partial<ProjectState>, Client: Partial<Client>, SubmissionBy: Partial<Organization> }, addedMember: ProjectMembers) {

    let role = getEnumKeyByEnumValue(ProjectRole, addedMember.projectRole);
    role = camelToSnakeCase(role);
    role = toSentenceCase(role);

    if (addedMember) {
      let isUserSubscribed = await this.prisma.user.findFirst({
        where: {
          AND: [
            {
              id: addedMember.userId,
              isDeleted: false,
            },
            {
              OR: [
                {
                  UserAlertsSetting: {
                    some: {
                      AlertsType: {
                        slug: "general"
                      },
                      email: true
                    }
                  },
                },
                {
                  UserAlertsSetting: {
                    none: {
                      AlertsType: {
                        slug: 'general'
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        select: UserDefaultAttributes
      })


      this.logger.log("Creating Project Member Notification");
      await this.prisma.notification.create({
        data: {
          message: `You have been added to a project. ${recordData.referenceNumber} | ${recordData.title} as ${role}.`,
          link: HOSTS.defaultAdminDomain + "/projects/" + recordData.slug + "?id=" + recordData?.id,
          linkLabel: "View Project",
          icon: notificationFileUploadPath + "/common/inventory.png",
          type: 'user',
          Subscribers: {
            create: {
              userId: addedMember.userId,
              read: false
            }
          }
        }
      })

      if (isUserSubscribed) {
        this.logger.log("Sending Project Member Add Email Notification to " + isUserSubscribed.email);
        await this.mailService.sendProjectMemberNotification(recordData, role, recordData.Client, recordData.SubmissionBy, isUserSubscribed);
      }
    }
    return this.handleNext();
  }

  getQuotation(recordId: number) {
    this.logger.log("Finding quotation data to send notification");
    return this.prisma.quotation.findUniqueOrThrow({
      where: {
        id: recordId
      },
      include: {
        Lead: {
          include: {
            Client: true
          }
        }
      }
    })
  }

  getFinanceUsers() {
    this.logger.log("Finding finance users who are subscribed to email notification");
    return this.prisma.user.findMany({
      where: {
        Department: {
          slug: Departments.finance
        },
        AND: {
          OR: [
            {
              UserAlertsSetting: {
                some: {
                  AlertsType: {
                    slug: "general"
                  },
                  email: true
                }
              },
            },
            {
              UserAlertsSetting: {
                none: {
                  AlertsType: {
                    slug: 'general'
                  }
                }
              }
            }
          ]
        },
        isDeleted: false
      },
      select: UserDefaultAttributes
    })
  }

  async sendQuotationNotification(recordId: number) {
    let recordData = await this.getQuotation(recordId);
    let financeUsers = await this.getFinanceUsers()
    this.logger.log("Creating Notification");
    await this.prisma.notification.create({
      data: {
        message: `Quotation DATP-${recordData.id} has been approved. Please collect the payment to start the project`,
        type: 'department',
        link: HOSTS.defaultAdminDomain + "/quotations/?id=" + recordData?.id,
        linkLabel: "View Quotation",
        icon: notificationFileUploadPath + "/common/verified.png",
        Department: {
          connectOrCreate: {
            where: {
              slug: Departments.finance
            },
            create: {
              title: "Finance",
              slug: Departments.finance
            }
          }
        }
      }
    })

    if (financeUsers.length > 0) {
      let allUserEmails = financeUsers.map((ele) => ele.email);
      this.logger.log("Sending Email Notification to " + allUserEmails.join(", "));
      await this.mailService.sendQuotationNotification(recordData, allUserEmails);
    }

  }

  async sendMilestoneCompletedNotification(recordId: number) {
    let recordData = await this.prisma.quotationMilestone.findFirst({
      where: {
        id: recordId
      },
      select: {
        id: true,
        title: true,
        CompletedBy: {
          select: UserDefaultAttributes
        },
        Quotation: {
          select: {
            id: true,
            Project: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      }
    });

    let financeUsers = await this.getFinanceUsers()
    this.logger.log("Creating Milestone Completed Notification");
    await this.prisma.notification.create({
      data: {
        message: `Milestone of Project ${recordData.Quotation?.Project?.title} has been completed and project has been set to auto hold. Please collect the payment to continue the project. Kindly resume the project if the payment is not required`,
        link: HOSTS.defaultAdminDomain + "/project/" + recordData?.Quotation?.Project?.slug + "?resume=true",
        linkLabel: "View Project",
        type: 'department',
        icon: notificationFileUploadPath + "/common/completed-task.png",
        Department: {
          connectOrCreate: {
            where: {
              slug: Departments.finance
            },
            create: {
              title: "Finance",
              slug: Departments.finance
            }
          }
        }
      }
    })

    if (financeUsers.length > 0) {
      let allUserEmails = financeUsers.map((ele) => ele.email);
      this.logger.log("Sending Milestone Email Notification to " + allUserEmails.join(", "));
      await this.mailService.sendMilestoneCompletedNotification(recordData.Quotation.Project, recordData.CompletedBy, allUserEmails);
    }
  }

  async sendEnquiryConfirmedNotification(leadId: number) {
    let recordData = await this.prisma.leads.findUniqueOrThrow({
      where: {
        id: leadId
      },
      select: {
        id: true,
        message: true,
        submissionById: true,
        assignedToId: true,
        Enquiry: {
          select: {
            id: true
          }
        },
        AddedBy: {
          select: UserDefaultAttributes
        },
        Client: {
          select: ClientDefaultAttributes
        }
      }
    });

    this.logger.log("Find Users who can receive enquiry confirmed Notification");
    let __subscribedUsers = await this.findUsersBasedOnPermission(LeadsPermissionSet.READ_ALL, false, {id: (recordData?.assignedToId) ? recordData.assignedToId : undefined});
    let subscribedUsers : typeof __subscribedUsers = []
    __subscribedUsers.forEach((ele) =>{
      if(ele.dataAccessRestrictedTo && ele.dataAccessRestrictedTo.length > 0 && ele.dataAccessRestrictedTo.includes(recordData.submissionById)){
        subscribedUsers.push(ele);
      }else{
        subscribedUsers.push(ele);
      }
    })
    let __emailSubscribers = await this.findUsersBasedOnPermission(LeadsPermissionSet.READ_ALL, true, {id: (recordData?.assignedToId) ? recordData.assignedToId : undefined});
    let emailSubscribers : typeof __emailSubscribers = []
    __emailSubscribers.forEach((ele) =>{
      if(ele.dataAccessRestrictedTo && ele.dataAccessRestrictedTo.length > 0 && ele.dataAccessRestrictedTo.includes(recordData.submissionById)){
        emailSubscribers.push(ele);
      }else{
        emailSubscribers.push(ele);
      }
    })

    this.logger.log("Creating Enquiry Confirmed Notification");
    await this.prisma.notification.create({
      data: {
        message: `Enquiry of ${recordData?.Client?.name} with reference ENQ-${recordData?.Enquiry.id} has been qualified and lead has been created. Please share the quotation to continue`,
        link: HOSTS.defaultAdminDomain + "/leads/?id=" + recordData?.id,
        linkLabel: "View Lead",
        icon: notificationFileUploadPath + "/common/phone-call.png",
        type: 'user',
        Subscribers: {
          createMany: {
            data: subscribedUsers.map((ele) => {
              return {
                userId: ele.id,
                read: false
              }
            })
          }
        }
      }
    })

    if (emailSubscribers.length > 0) {
      let allUserEmails = emailSubscribers.map((ele) => ele.email);
      this.logger.log("Sending Enquiry Confirmed Email Notification to " + allUserEmails.join(", "));
      await this.mailService.sendEnquiryConfirmedNotification(recordData, recordData.Client, recordData.AddedBy, allUserEmails);
    }
  }

  async findUsersBasedOnPermission(permission: string | string[], emailSubscribers?: boolean, condition?: Prisma.UserWhereInput ) {
    let allPermission = [];
    if(Array.isArray(permission)){
      allPermission = permission
    }else{
      allPermission = [permission]
    }
    if(!condition){
      condition = {}
    }
    return this.prisma.user.findMany({
      where: {
        ...condition,
        AND: [
          {
            userRole: {
              some: {
                Role: {
                  RolePermissions: {
                    some: {
                      Permission: {
                        action: {
                          in: allPermission
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            isDeleted: false,
          },
          (emailSubscribers) ?
            {
              OR: [
                {
                  UserAlertsSetting: {
                    some: {
                      AlertsType: {
                        slug: "general"
                      },
                      email: true
                    }
                  },
                },
                {
                  UserAlertsSetting: {
                    none: {
                      AlertsType: {
                        slug: 'general'
                      }
                    }
                  }
                }
              ]
            } : undefined,
        ]
      },
      select: UserDefaultAttributes
    })
  }

  async findProjectUsers(projectId: number, emailSubscribers?: boolean) {
    let allAdminUsers = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            userRole: {
              some: {
                Role: {
                  RolePermissions: {
                    some: {
                      Permission: {
                        action: ProjectPermissionSet.REAL_ALL_PROJECT,
                      }
                    }
                  }
                }
              }
            }
          },
          {
            isDeleted: false,
          },
          (emailSubscribers) ?
            {
              OR: [
                {
                  UserAlertsSetting: {
                    some: {
                      AlertsType: {
                        slug: "general"
                      },
                      email: true
                    }
                  },
                },
                {
                  UserAlertsSetting: {
                    none: {
                      AlertsType: {
                        slug: 'general'
                      }
                    }
                  }
                }
              ]
            } : undefined,
        ]
      },
      select: UserDefaultAttributes
    })

    let adminUsersId = allAdminUsers.map((ele) => ele.id);
    let otherProjectMembers = await this.prisma.projectMembers.findMany({
      where: {
        AND: [
          {
            projectId: projectId,
            NOT: {
              id: {
                in: adminUsersId
              }
            }
          },
          (emailSubscribers) ?
            {
              User: {
                OR: [
                  {
                    UserAlertsSetting: {
                      some: {
                        AlertsType: {
                          slug: "general"
                        },
                        email: true
                      }
                    },
                  },
                  {
                    UserAlertsSetting: {
                      none: {
                        AlertsType: {
                          slug: 'general'
                        }
                      }
                    }
                  }
                ]
              }
            } : undefined,
        ]
      },
      include: {
        User: {
          select: UserDefaultAttributes
        }
      }
    })

    let otherUsers = otherProjectMembers.map((ele) => ele.User);
    return [...allAdminUsers, ...otherUsers];
  }

  async sendDailyNotification() {
    try {
      await this.sendQuotationFollowupNotification();
      await this.sendAssignedQuotationFollowupNotification();
      await this.sendInvoiceFollowupNotification();
      await this.sendLeadsFollowupNotification();
      await this.sendGovernmentFeesToCollectNotification();
    } catch (err) {
      this.logger.error("Some error while sending daily notification", err.message);
    } finally {
      return this.handleNext();
    }
  }
  async sendAssignedQuotationFollowupNotification(){
    let last7Day =  new Date();
    last7Day.setDate(last7Day.getDate() - 7);
    last7Day.setHours(0,0,0,0);

    const rawQuery =`SELECT "U"."id" as "userId", "U"."email" as "userEmail", "U"."firstName" as "firstName",  "U"."lastName" as "lastName",  COUNT("Q"."id") as "quotationCount" FROM "User" "U"
    LEFT JOIN "Leads" "L" ON "U"."id" = "L"."assignedToId"
    LEFT JOIN "Quotation" "Q" ON "L"."id" = "Q"."leadId"
    WHERE (
      "Q"."status" IN (${QuotationStatus.submitted}, ${QuotationStatus.created})
      AND (
        "Q"."sentDate" <= '${last7Day.toISOString()}' 
        OR 
        (
          "Q"."addedDate" <= '${last7Day.toISOString()}' AND "Q"."status" = ${QuotationStatus.created}
        )
      )
    )
    GROUP BY "userId", "userEmail"
    HAVING COUNT("Q"."id") > 0`;

    try{
    const rawData: Array<{userId: number, userEmail: string, quotationCount: number, firstName: string, lastName: string}> = await this.prisma.$queryRawUnsafe(rawQuery);
    if(rawData.length === 0){
      return
    }

    this.logger.log("Creating Quotation Followup Notification To Assigned Users");
    for(let i=0; i< rawData.length ; i++){
      let ele = rawData[i];
      await this.prisma.notification.create({
        data: {
          message: `There are ${ele.quotationCount} qotations which are older than 7 days and are waiting for approval or submission to client. Kidly take the necessary action to update the status`,
          link: HOSTS.defaultAdminDomain + "/quotations",
          linkLabel: "View Quotations",
          icon: notificationFileUploadPath + "/common/phone-call.png",
          type: 'user',
          Subscribers: {
            create:{
              userId: ele.userId,
              read: false
            }
          }
        }
      })
  
      // if (emailSubscribers.length > 0) {
        // let allUserEmails = emailSubscribers.map((ele) => ele.email);
        // this.logger.log("Sending Quotation Followup Email Notification to " + allUserEmails.join(", "));
        await this.mailService.sendQuotationFollowupNotification(ele.userEmail, ele.quotationCount, ele.firstName + " " + ele.lastName);
      // }
    }
  }catch(err){
    console.log(err);
    this.logger.error("Some error while sending quotation followup notification to each user", err?.message);
  }
  }

  async sendQuotationFollowupNotification(){
    let last7Day =  new Date();
    last7Day.setDate(last7Day.getDate() - 7);
    last7Day.setHours(0,0,0,0);

    let quotations = await this.prisma.quotation.count({
      where:{
        status: {
          in: [QuotationStatus.submitted, QuotationStatus.created]
        },
        Lead:{
          assignedToId: null
        },
        AND: {
          OR: [
            {
              sentDate: {
                gte: last7Day
              }
            },
            {
              addedDate:{
                gte: last7Day
              }
            }
          ]
        }
      }
    })

    if(quotations === 0 || quotations === null){
      return
    }

    this.logger.log("Find Users who can receive quotation followup Notification");
    let subscribedUsers = await this.findUsersBasedOnPermission(QuotationPermissionSet.READ);
    let emailSubscribers = await this.findUsersBasedOnPermission(QuotationPermissionSet.READ, true);
    this.logger.log("Creating Unassigned Quotation Followup Confirmed Notification");
    await this.prisma.notification.create({
      data: {
        message: `There are ${quotations} qotations which are waiting for approval. These quotations are not assigned to any team members. Kidly followup with client and update the status`,
        link: HOSTS.defaultAdminDomain + "/quotations",
        linkLabel: "View Quotations",
        icon: notificationFileUploadPath + "/common/phone-call.png",
        type: 'user',
        Subscribers: {
          createMany: {
            data: subscribedUsers.map((ele) => {
              return {
                userId: ele.id,
                read: false
              }
            })
          }
        }
      }
    })

    if (emailSubscribers.length > 0) {
      // let allUserEmails = emailSubscribers.map((ele) => ele.email);
      // this.logger.log("Sending Quotation Followup Email Notification to " + allUserEmails.join(", "));
      // await this.mailService.sendEnquiryConfirmedNotification(recordData, recordData.Client, recordData.AddedBy, allUserEmails);
    }
  }

  async sendInvoiceFollowupNotification(){
    let last7Day =  new Date();
    last7Day.setDate(last7Day.getDate() - 7);
    last7Day.setHours(0,0,0,0);

    let invoicesCount = await this.prisma.invoice.count({
      where:{
        status: {
          in: [InvoiceStatus.sent, InvoiceStatus.generated]
        },
        AND:{
          OR:[
            {
              sentDate: {
                gte: last7Day
              }
            },
            {
              addedDate:{
                gte: last7Day
              }
            }
          ]
        }
      }
    })

    if(invoicesCount === 0 || invoicesCount === null){
      return
    }

    this.logger.log("Find Users who can receive invoice followup Notification");
    let subscribedUsers = await this.findUsersBasedOnPermission(InvoicePermissionSet.READ);
    let emailSubscribers = await this.findUsersBasedOnPermission(InvoicePermissionSet.READ, true);
    this.logger.log("Creating Invoice Followup Confirmed Notification");
    await this.prisma.notification.create({
      data: {
        message: `There are ${invoicesCount} invoices which are not cleared from last 7 days. Kidly followup with client and update the status`,
        link: HOSTS.defaultAdminDomain + "/invoice",
        linkLabel: "View Invoices",
        icon: notificationFileUploadPath + "/common/inventory.png",
        type: 'user',
        Subscribers: {
          createMany: {
            data: subscribedUsers.map((ele) => {
              return {
                userId: ele.id,
                read: false
              }
            })
          }
        }
      }
    })

    if (emailSubscribers.length > 0) {
      // let allUserEmails = emailSubscribers.map((ele) => ele.email);
      // this.logger.log("Sending Quotation Followup Email Notification to " + allUserEmails.join(", "));
      // await this.mailService.sendEnquiryConfirmedNotification(recordData, recordData.Client, recordData.AddedBy, allUserEmails);
    }
  }

  async sendLeadsFollowupNotification(){
    let last7Day =  new Date();
    last7Day.setDate(last7Day.getDate() - 7);
    last7Day.setHours(0,0,0,0);

    let leads = await this.prisma.leads.groupBy({
      by: ['assignedToId'],
      where:{
        assignedToId:{
          not: null
        },
        status: {
          in: [LeadsStatus.in_progress, LeadsStatus.new]
        },
        OR:[
          {
            addedDate: {lte: last7Day},
            Quotation:{
              none:{
                sentDate: {
                  gte: last7Day
                },
                status: {
                  in: [QuotationStatus.submitted, QuotationStatus.created]
                }
              }
            }
        },
          {Quotation:{
            some:{
              sentDate: {
                lte: last7Day
              },
              status: {
                in: [QuotationStatus.submitted, QuotationStatus.created]
              }
            }
          }}
        ]
      },
      _count:{
        id: true
      }
    })

    if(!leads || leads.length === 0){
      return
    }

    for(let i=0; i< leads.length; i++){
      let ele = leads[i];
      await this.prisma.notification.create({
        data: {
          message: `There are ${ele._count.id} leads which has not received quotations yet or has not approved since 7 days. Kidly followup with client and update the status`,
          link: HOSTS.defaultAdminDomain + "/leads",
          linkLabel: "View Leads",
          icon: notificationFileUploadPath + "/common/phone-call.png",
          type: 'user',
          Subscribers: {
            create:{
              userId: ele.assignedToId,
              read: false
            }
          }
        }
      })
  
      // if (emailSubscribers.length > 0) {
        // let allUserEmails = emailSubscribers.map((ele) => ele.email);
        // this.logger.log("Sending Quotation Followup Email Notification to " + allUserEmails.join(", "));
        // await this.mailService.sendEnquiryConfirmedNotification(recordData, recordData.Client, recordData.AddedBy, allUserEmails);
      // }
    }
  }

  async sendGovernmentFeesToCollectNotification(){
    let last7Day =  new Date();
    last7Day.setDate(last7Day.getDate() - 7);
    last7Day.setHours(0,0,0,0);

    let governmentFees = await this.prisma.transactions.count({
      where:{
        status: {
          in: [TransactionStatus.pending_payment, TransactionStatus.sent_to_client]
        },
        transactionDate: {
          gte: last7Day
        },
      }
    })

    if(governmentFees === 0 || governmentFees === null){
      return
    }

    this.logger.log("Find Users who can receive government fees followup Notification");
    let subscribedUsers = await this.findUsersBasedOnPermission(TransactionPermissionSet.READ);
    let emailSubscribers = await this.findUsersBasedOnPermission(TransactionPermissionSet.READ, true);
    this.logger.log("Creating Government Fees Notification");
    await this.prisma.notification.create({
      data: {
        message: `There are ${governmentFees} government fees which are to be collected from clients. Kidly followup with client and update the status`,
        link: HOSTS.defaultAdminDomain + "/transactions",
        linkLabel: "View Government Fees",
        icon: notificationFileUploadPath + "/common/phone-call.png",
        type: 'user',
        Subscribers: {
          createMany: {
            data: subscribedUsers.map((ele) => {
              return {
                userId: ele.id,
                read: false
              }
            })
          }
        }
      }
    })

    if (emailSubscribers.length > 0) {
      // let allUserEmails = emailSubscribers.map((ele) => ele.email);
      // this.logger.log("Sending Quotation Followup Email Notification to " + allUserEmails.join(", "));
      // await this.mailService.sendEnquiryConfirmedNotification(recordData, recordData.Client, recordData.AddedBy, allUserEmails);
    }
  }
}

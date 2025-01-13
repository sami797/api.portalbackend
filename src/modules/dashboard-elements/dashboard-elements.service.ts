import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateDashboardElementDto } from './dto/create-dashboard-element.dto';
import { UpdateDashboardElementDto } from './dto/update-dashboard-element.dto';
import { DashboardElementFilters } from './dto/dashboard-element-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { CashAdvanceRequestStatus, EnquiryStatus, InvoiceStatus, LeadsStatus, LeaveRequestStatus, ProjectRole, QuotationStatus, ReimbursementStatus, SUPER_ADMIN, TransactionStatus, UserStatus } from 'src/config/constants';
import { ProjectFiltersDto } from './dto/dashboard-project-filters.dto';
import { ReimbursementPermissionSetType } from '../reimbursement/reimbursement.permissions';
import { CashAdvancePermissionSetType } from '../cash-advance/cash-advance.permissions';
import { LeaveRequestPermissionSetType } from '../leave-request/leave-request.permissions';

@Injectable()
export class DashboardElementsService {

  private readonly logger = new Logger(DashboardElementsService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateDashboardElementDto) {
    return this.prisma.dashboardElement.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.DashboardElementWhereInput) {
    let records = this.prisma.dashboardElement.findMany({
      where: filters,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.dashboardElement.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findBySlug(slug: string) {
    return this.prisma.dashboardElement.findUnique({
      where: {
        slug: slug
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateDashboardElementDto) {

    return this.prisma.dashboardElement.update({
      data: updateDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number) {
    return this.prisma.dashboardElement.update({
      data: {
        isPublished: false,
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

  applyFilters(filters: DashboardElementFilters) {
    let condition: Prisma.DashboardElementWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if (filters.isPublished) {
        condition = { ...condition, isPublished: filters.isPublished }
      }
    }
    return condition;
  }

  async findDashboardElementsOfUser(user: AuthenticatedUser){
    let userRole = await this.prisma.role.findFirst({
      where:{
        UserRole:{
          some:{
            userId: user.userId
          }
        },
        DashboardElements:{
          some:{
            DashboardElement:{
              isDeleted: false,
              isPublished: true
            }
          }
        }
      },
      orderBy:{
        level: 'asc'
      }
    })
    
    if(!userRole){
      throw {
        message: "No Dashboard Element Found for the given user",
        statusCode: 200
      }
    }

    return this.prisma.roleDashboardElement.findMany({
      where:{
        roleId: userRole.id,
        DashboardElement:{
          isDeleted: false,
          isPublished: true
        }
      },
      include:{
        DashboardElement: {
          select:{
            slug: true
          }
        }
      },
      orderBy:{
        order: 'asc'
      }
    })
  }

  applyProjectFilters(filters: ProjectFiltersDto, user: AuthenticatedUser, hasGlobalPermission: boolean = false) {
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

      if (filters.fromDate) {
        condition = {
          ...condition,
          addedDate: {
            gte: filters.fromDate
          }
        }
      }

      if (filters.delayed) {
        condition = {
          ...condition,
          isClosed: false,
          endDate:{
            lt: new Date()
          }
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

  findAllProjects(filters: Prisma.ProjectWhereInput, rawFilters?: ProjectFiltersDto) {
    return this.prisma.project.findMany({
      where: filters,
      take: 8,
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        priority: true,
        referenceNumber: true,
        comment: true,
        onHold: true,
        ProjectState: {
          select: {
            id: true,
            title: true,
            slug: true,
            bgColor: true,
            textColor: true
          }
        },
        addedDate: true,
        ProjectType: {
          select: {
            title: true,
            slug: true
          }
        },
      },
      orderBy: (rawFilters && rawFilters?.delayed) ? {
        endDate: 'asc'
      } : {
        addedDate: 'desc'
      }
    });
  }
  
  findActiveQuotation(){
    return this.prisma.quotation.count({
      where:{
        isDeleted: false,
        status: QuotationStatus.submitted
      }
    })
  }

  findActiveLeads(){
    return this.prisma.leads.count({
      where:{
        isDeleted: false,
        status: {
          in: [LeadsStatus.in_progress, LeadsStatus.new]
        }
      }
    })
  }

  findActiveEnquiry(user: AuthenticatedUser, readAll: boolean = false){
    let condition : Prisma.EnquiryWhereInput = {
      isDeleted: false,
      status: EnquiryStatus.New
    }

    if(readAll !== true){
      condition = {
        ...condition, 
        assignedToId: user.userId
      }
    }

    return this.prisma.enquiry.count({
      where:condition
    })
  }

  findActiveInvoices(){
    return this.prisma.invoice.count({
      where:{
        isDeleted: false,
        status: {
          in: [InvoiceStatus.generated, InvoiceStatus.sent]
        }
      }
    })
  }


  findActiveReimbursement(user: AuthenticatedUser, permissions: Partial<ReimbursementPermissionSetType>) {
    let condition: Prisma.ReimbursementWhereInput = {
      isDeleted: false
    };

      let statusCode = [];
      if(permissions.reimbursementHRApproval){
        statusCode.push(ReimbursementStatus.submitted)
      }

      if(permissions.reimbursementFinanceApproval){
        statusCode.push(ReimbursementStatus.approved)
        statusCode.push(ReimbursementStatus.partially_approved)
      }

      condition = {
        ...condition,
       AND:{
        OR:[
          {
            requestById: user.userId,
            status:{
              notIn: [ReimbursementStatus.paid_and_closed, ReimbursementStatus.rejected, ReimbursementStatus.withdrawn]
            }
          },
          (statusCode.length > 0)?
          {
            status: {
              in: statusCode
            }
          }: undefined
        ]
       }
      }

      return this.prisma.reimbursement.count({
        where: condition
      })
  }

  findActiveCashAdvanceRequest(user: AuthenticatedUser, permissions: Partial<CashAdvancePermissionSetType>) {
    let condition: Prisma.CashAdvanceRequestWhereInput = {
    };

      let statusCode = [];
      if(permissions.cashAdvanceHRApproval){
        statusCode.push(CashAdvanceRequestStatus.submitted)
      }

      if(permissions.cashAdvanceFinanceApproval){
        statusCode.push(CashAdvanceRequestStatus.approved)
        statusCode.push(CashAdvanceRequestStatus.partially_approved)
      }

      condition = {
        ...condition,
       AND:{
        OR:[
          {
            requestById: user.userId,
            status:{
              notIn: [CashAdvanceRequestStatus.paid_and_closed, CashAdvanceRequestStatus.rejected, CashAdvanceRequestStatus.withdrawn]
            }
          },
          (statusCode.length > 0)?
          {
            status: {
              in: statusCode
            }
          }: undefined
        ]
       }
      }

      return this.prisma.cashAdvanceRequest.count({
        where: condition
      })
  }

  findActiveLeaveRequest(user: AuthenticatedUser, permissions: Partial<LeaveRequestPermissionSetType>) {
    let condition: Prisma.LeaveRequestWhereInput = {
    };

      let statusCode = [];
      if (permissions.leaveRequestHRApproval) {
        statusCode.push(LeaveRequestStatus.in_progress)
      }

      condition = {
        ...condition,
       AND:{
        OR:[
          {
            requestById: user.userId,
            status:{
              in: [LeaveRequestStatus.in_progress, LeaveRequestStatus.submitted, LeaveRequestStatus.request_modification]
            }
          },
          {
            status: LeaveRequestStatus.submitted,
            RequestBy: {
              managerId: user.userId
            }
          },
          (statusCode.length > 0)?
          {
            status: {
              in: statusCode
            }
          }: undefined
        ]
       }
      }

      return this.prisma.leaveRequest.count({
        where: condition
      })
  }

  findPendingProject_dashboard(user: AuthenticatedUser, memberType : keyof typeof ProjectRole){
    return this.prisma.project.count({
      where:{
        isDeleted: false,
        isClosed: false,
        ProjectMembers:{
          some:{
            userId: user.userId,
            projectRole: ProjectRole[memberType]
          }
        }
      }
    })
  }

  findPermitExpiring(){
    let after30Days = new Date();
    after30Days.setDate(after30Days.getDate() + 30);
    return this.prisma.permit.count({
      where:{
        isDeleted: false,
        expiryDate:{
          lte: after30Days,
          gte: new Date()
        },
      }
    })
  }

  findGovernmentFeesToCollect(){
    return this.prisma.transactions.count({
      where:{
        status: {
          in: [TransactionStatus.sent_to_client, TransactionStatus.pending_payment]
        },
        authorityId: {not: null},
        isDeleted: false
      }
    })
  }

  findActiveEmployees(){
    return this.prisma.user.count({
      where:{
        status: UserStatus.active,
        isDeleted: false
      }
    })
  }
}


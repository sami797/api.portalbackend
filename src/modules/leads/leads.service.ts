import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Enquiry, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsPaginationDto } from './dto/lead-pagination.dto';
import { LeadsSortingDto } from './dto/lead-sorting.dto';
import { LeadsFiltersDto } from './dto/lead-filters.dto';
import { LeadsStatusDto } from './dto/lead-status.dto';
import { MailService } from 'src/mail/mail.service';
import { AssignLeadsDto } from './dto/assign-leads.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { CreateLeadNoteDto } from './dto/create-load-note.dto';
import { KnownProjectStatus, LeadsStatus, QuotationStatus } from 'src/config/constants';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { ClientDefaultAttributes } from '../client/dto/client.dto';
import { UploadLeadDocuments } from './dto/upload-files.dto';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { OrganizationDefaultAttributes } from '../organization/dto/organization.dto';

@Injectable()
export class LeadsService {

  private readonly logger = new Logger(LeadsService.name);
  constructor(private prisma: PrismaService, private readonly mailService: MailService) {
  }

  create(createLeadDto: CreateLeadDto) {
    return this.prisma.leads.create({
      data: createLeadDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(pagination: LeadsPaginationDto, sorting: LeadsSortingDto, condition: Prisma.LeadsWhereInput, includeNotes : boolean = false) {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.LeadsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };

    let records = this.prisma.leads.findMany({
      where: condition,
      skip: skip,
      take: take,
      include:{
        _count:{
          select:{
            LeadEnquiryFollowUp: {
              where:{
                isDeleted: false
              }
            }
          }
        },
        Attachments: {
          where:{
            isDeleted: false
          }
        },
        Quotation:{
          include:{
            AddedBy: {
              select: UserDefaultAttributes
            }
          },
          orderBy:[
            {
              addedDate: 'desc'
            }
          ]
        },
        SubmissionBy:{
          select: OrganizationDefaultAttributes
        },
        LeadEnquiryFollowUp: {
          where:{
            isDeleted: false
          },
          include:{
            AddedBy:{
              select:UserDefaultAttributes
            }
          },
          take: 3,
          orderBy:{
            addedDate: 'desc'
          }
        },
        AssignedTo:{
          select: UserDefaultAttributes
        },
        Client:{
          select: ClientDefaultAttributes
        },
        Representative:{
          select: ClientDefaultAttributes
        },
        ProjectType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        Project:{
          select:{
            id: true,
            title: true
          }
        }
      },
      orderBy: __sorter
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.leads.findUnique({
      where: {
        id: id
      },
      include:{
        LeadEnquiryFollowUp: {
          where:{
            isDeleted: false
          },
          include:{
            AddedBy:{
              select:UserDefaultAttributes
            }
          },
          orderBy:{
            addedDate: 'desc'
          }
        },
        SubmissionBy:{
          select: OrganizationDefaultAttributes
        },
        Attachments: {
          where:{
            isDeleted: false
          }
        },
        Quotation:{
          include:{
            AddedBy: {
              select: UserDefaultAttributes
            }
          },
          orderBy:[
            {
              sentDate: 'desc'
            },
            {
              addedDate: 'desc'
            }
          ]
        },
        AssignedTo:{
          select: UserDefaultAttributes
        },
        Client:{
          select: ClientDefaultAttributes
        },
        Representative:{
          select: ClientDefaultAttributes
        },
        ProjectType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        Project:{
          select:{
            id: true,
            title: true
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateLeadDto: UpdateLeadDto) {
    //const {xeroTenantId, ...rest} = updateLeadDto;
    const {...rest} = updateLeadDto;
    //let updatedXeroTenantId = xeroTenantId;
    if(updateLeadDto.submissionById){
      let currentData = await this.prisma.leads.findUniqueOrThrow({
        where:{
          id: id
        },
        include:{
          _count:{
            select:{
              Quotation: true
            }
          }
        }
      })

      // if(currentData.xeroTenantId && currentData._count?.Quotation > 0){
      //   updatedXeroTenantId = null
      // }
    }

    return this.prisma.leads.update({
      data: {
        ...rest,
        //xeroTenantId: (updatedXeroTenantId) ? updatedXeroTenantId : undefined
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

  applyFilters(filters: LeadsFiltersDto, user: AuthenticatedUser, readAllLeads: boolean) {
    let condition: Prisma.LeadsWhereInput = {
      isDeleted: false
    };
    if (Object.entries(filters).length > 0) {

      // if (filters.status) {
      //   condition = { ...condition, status: filters.status }
      // }
      if (filters.projectTypeTitle) {
        condition = {
            ...condition,
            Client: {
                name: {
                    contains: filters.projectTypeTitle,
                    mode: 'insensitive'  // For case-insensitive search
                }
            }
        };
    }
    
      if(filters.__status){
        condition = { ...condition, status: {
          in: filters.__status
        } }
      }

      if(filters.fetchCompleted){
        condition = {
          ...condition,
          Project:{
            ProjectState:{
              slug:{
                in: [KnownProjectStatus.completed, KnownProjectStatus.canceled]
              }
            }
          }
        }
      }

      if (filters.clientId) {
        condition = { ...condition, clientId: filters.clientId }
      }

      if (filters.assignedToId) {
        condition = { ...condition, assignedToId: filters.assignedToId }
      }

      if (filters.enquiryId) {
        condition = { ...condition, enquiryId: filters.enquiryId }
      }

      if (filters.representativeId) {
        condition = { ...condition, representativeId: filters.representativeId }
      }

      if (filters.projectTypeId) {
        condition = { ...condition, projectTypeId: filters.projectTypeId }
      }

      if (filters.hasConcerns) {
        condition = { ...condition, 
        LeadEnquiryFollowUp:{
          some:{
            isConcern: true,
            isResolved: false
          }
        }
        }
      }

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
    }
      if (!readAllLeads) {
        if(condition.AND){
          if(Array.isArray(condition.AND)){
            condition.AND.push({
              OR: [
                { addedById: user.userId },
                { assignedToId: user.userId }
              ]
            })
          }else{
            condition.AND = [
              condition.AND,
              {
                OR: [
                  { addedById: user.userId },
                  { assignedToId: user.userId }
                ]
              }
            ]
          }
        }else{
          condition = {
            ...condition,
            AND: {
              OR: [
                { addedById: user.userId },
                { assignedToId: user.userId }
              ]
            }
          }
        }
      }else{
        if(user.litmitAccessTo && user.litmitAccessTo.length > 0){
          condition = {
            ...condition,
            submissionById: {
              in: user.litmitAccessTo
            }
          }
        }
      }
    return condition
  }

  countTotalRecord(filters: Prisma.LeadsWhereInput) {
    return this.prisma.leads.count({
      where: filters
    })
  }

  async updateStatus(leadsId: number, leadsStatusDto: LeadsStatusDto) {
    let recordData = await this.prisma.leads.update({
      where: {
        id: leadsId
      },
      data: {
        ...leadsStatusDto,
        Quotation:{
          updateMany:{
            where:{
              leadId: leadsId
            },
            data:{
              status: QuotationStatus.rejected
            }
          }
        }
      }
    })

    return recordData;

  }

  assignLeads(leadsId: number, asignPropertyDto: AssignLeadsDto, user: AuthenticatedUser){
    return this.prisma.leads.update({
      where:{
        id: leadsId,
      },
      data:{
        assignedToId: asignPropertyDto.assignedToId,
        assignedById: user.userId
      }
    })
  }

  async addNote (leadId: number, createLeadNoteDto: CreateLeadNoteDto, user: AuthenticatedUser){
    let leadData = await this.findOne(leadId);
    return this.prisma.leadEnquiryFollowUp.create({
      data:{
        leadId: leadId,
        note: createLeadNoteDto.note,
        isConcern: createLeadNoteDto.isConcern,
        addedById: user.userId,
        enquiryId: (leadData) ? leadData.enquiryId : undefined
      }
    })
  }

  removeNote (noteId: number){
    return this.prisma.leadEnquiryFollowUp.update({
      where:{
        id: noteId
      },
      data:{
        isDeleted: true
      }
    })
  }

  removeDocument (documentId: number){
    return this.prisma.enquiryAttachment.update({
      where:{
        id: documentId
      },
      data:{
        isDeleted: true
      }
    })
  }

  findAllNotes(leadId: number){
    return this.prisma.leadEnquiryFollowUp.findMany({
      where:{
        leadId: leadId,
        isDeleted: false
      },
      orderBy:{
        addedDate: 'desc'
      },
      include:{
        AddedBy:{
          select:{
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            profile: true,
            email: true,
          }
        }
      }
    })
  }


  removeLead (leadId: number){
    return this.prisma.leads.update({
      where:{
        id: leadId
      },
      data:{
        isDeleted: true
      }
    })
  }

  async handleDocuments(uploadDocuments: UploadLeadDocuments, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let leadData = await this.prisma.leads.findUnique({
      where: {
        id: uploadDocuments.leadId
      },
      include:{
        Enquiry: true
      }
    })

    if (!leadData) {
      throw new NotFoundException({ message: "Enquiry with the provided id not Found", statusCode: 400 })
    }
    let insertData: Array<Prisma.EnquiryAttachmentUncheckedCreateInput> = files.map((ele, index) => {
      let newRecord : Prisma.EnquiryAttachmentUncheckedCreateInput = {
        title: ele.originalname,
        file:extractRelativePathFromFullPath(ele.path),
        mimeType: ele.mimetype,
        enquiryId: (leadData.enquiryId) ? leadData.enquiryId : undefined,
        leadId: leadData.id,
        fileSize: ele.size / 1024 // in KB
      }
      return newRecord;
    });

    if (insertData.length > 0) {
      return this.prisma.enquiryAttachment.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return []
    }
  }

  markConcernAsResolved(noteId: number){
    return this.prisma.leadEnquiryFollowUp.update({
      where:{
        id: noteId
      },
      data:{
        isResolved: true
      }
    })
  }
}


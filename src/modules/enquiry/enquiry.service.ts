import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client, Enquiry, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { ClientType, EnquiryStatus, GenericEmailDomains } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { EnquiryFiltersDto } from './dto/enquiry-filters.dto';
import { IsFalseRequest } from 'src/authentication/types/is-false-request.types';
import { getBusinessMinutesDiff, getMinutesDiff } from 'src/helpers/common';
import { EnquiryStatusDto } from './dto/enquiry-status.dto';
import { CreateEnquiryNoteDto } from './dto/create-enquiry-note.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { AutoCreateLeadFromEnquiryDto } from './dto/auto-create-lead-from-enquiry.dto';
import { NotificationEventDto } from '../notification/dto/notification.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadEnquiryDocuments } from './dto/upload-files.dto';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';

@Injectable()
export class EnquiryService {

  private readonly logger = new Logger(EnquiryService.name);
  constructor(private prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {
  }

  create(createDto: CreateEnquiryDto) {
    return this.prisma.enquiry.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(pagination:  Pagination, condition: Prisma.EnquiryWhereInput) {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;

    let records = this.prisma.enquiry.findMany({
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
        ProjectType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
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
        ModifiedBy:{
          select: UserDefaultAttributes
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.enquiry.findUnique({
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
          take: 3,
          orderBy:{
            addedDate: 'desc'
          }
        },
        Attachments: {
          where:{
            isDeleted: false
          }
        },
        ProjectType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        AssignedTo:{
          select: UserDefaultAttributes
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async findDuplicateClient(id: number){
    let enquiry = await this.findOne(id);
    let email = enquiry.email;
    let domainAddress = email.split("@")[1];
    if(GenericEmailDomains.includes(domainAddress)){
      return this.prisma.client.findMany({
        where:{
          email: {
            equals: email,
            mode: 'insensitive'
          },
          isDeleted: false
        },
        select:{
          id: true,
          name: true,
          email: true,
          type: true,
          uuid: true,
          phone: true,
          phoneCode: true
        }
      })
    }else{
      return this.prisma.client.findMany({
        where:{
          email: {
            contains: domainAddress,
            mode: 'insensitive'
          },
          isDeleted: false
        },
        select:{
          id: true,
          name: true,
          email: true,
          type: true,
          uuid: true,
          phone: true,
          phoneCode: true
        }
      })
    }
  }

  update(id: number, updateDto: UpdateEnquiryDto) {

    return this.prisma.enquiry.update({
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

  applyFilters(filters: EnquiryFiltersDto, user: AuthenticatedUser, readAllEnquiry: boolean) {
    let condition: Prisma.EnquiryWhereInput = {
      isDeleted: false
    };
    if (Object.entries(filters).length > 0) {
      if (filters.email) {
        condition = { ...condition, email: filters.email }
      }
      if (filters.phone) {
        condition = { ...condition, phone: { contains: filters.phone } }
      }

      if (filters.source) {
        condition = { ...condition, source: filters.source }
      }

      if (filters.assignedToId) {
        condition = { ...condition, assignedToId: filters.assignedToId }
      }

      if (filters.status) {
        condition = { ...condition, status: filters.status }
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

      if (!readAllEnquiry) {
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
      }

      if (filters.userAgent) {
        condition = { ...condition, userAgent: {
          contains: filters.userAgent,
          mode: 'insensitive'
        }}
      }


      if (filters.userIP) {
        condition = { ...condition, userIP: {
          contains: filters.userIP
        }}
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

      if (filters.name) {
        condition = {
          ...condition, name: {
            contains: filters.name,
            mode: 'insensitive'
          }
        }
      }
    }
    return condition
  }

  countTotalRecord(filters: Prisma.EnquiryWhereInput) {
    return this.prisma.enquiry.count({
      where: filters
    })
  }

  async updateStatus(enquiryId: number, enquiryStatusDto: EnquiryStatusDto) {
    let recordData = await this.prisma.enquiry.findFirst({
      where:{
        id: enquiryId
      },
      select:{
        status: true
      }
    })

    if(recordData.status === EnquiryStatus.Qualified){
      throw {
        message: "This enquiry was already marked as Qualified. You cannot make further changes",
        statusCode: 400
      }
    }

    return this.prisma.enquiry.update({
      where: {
        id: enquiryId
      },
      data: enquiryStatusDto
    })
  }

  checkIfAlreadyRequested(createEnquiryDto: CreateEnquiryDto) {
    let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    let condition: Prisma.EnquiryWhereInput = {
      email: createEnquiryDto.email,
      status: EnquiryStatus.New,
      isDeleted: false,
      addedDate: {
        gt: yesterday
      },
      phone: createEnquiryDto.phone,
      source: createEnquiryDto.source,
      slug: createEnquiryDto.slug,
    }

    if (createEnquiryDto.phone) {
      condition = { ...condition, phone: createEnquiryDto.phone }
    }

    return this.prisma.enquiry.findFirst({
      where: condition,
    })
  }


  async isFalseRequest(userIPAddress: string, userAgent: string): Promise<IsFalseRequest> {

    let waitTime = 30;
    let thresholdTime = new Date(new Date().getTime() - (60 * 5 * 1000)); // 5 minutes
    let numberOfLookupsBySameAgent = await this.prisma.enquiry.count({
      where: {
        userAgent: userAgent,
        userIP: userIPAddress,
        addedDate: {
          gte: thresholdTime
        },
        status: {
          in: [EnquiryStatus.New, EnquiryStatus.Spam]
        }
      }
    })

    if (numberOfLookupsBySameAgent >= 20) {
      let lastSentTime = await this.prisma.enquiry.findFirst({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        select: {
          id: true,
          addedDate: true,
          email: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInMinute = Math.ceil(differenceInTime / 1000 / 60);
      if (differenceInMinute < waitTime) {
        let res = {
          canActivate: false,
          message: `Maximum request reached. Please wait ${waitTime - differenceInMinute} minutes and try again`,
          waitTime: waitTime - differenceInMinute // in minutes
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : IS_FALSE_REQUEST:THRESHOLD_MEET_SAME_AGENT  \n Error message : " + res.message);
        return res;
      }
    }

    return {
      canActivate: true,
      message: `Can create an enquiry`
    }
  }

  markAsReplied(enquiryData: Enquiry){
    // let enquiryData = "";
    let sentTime = enquiryData.addedDate;
    let repliedTime = new Date();
    let difference = getBusinessMinutesDiff(sentTime, repliedTime);
    return this.prisma.enquiry.update({
      where:{
        id: enquiryData.id
      },
      data:{
        hasReplied: true,
        repliedDate: repliedTime,
        timeDifference: difference
      }
    })
  }


  async addNote (enquiryId: number, createNote: CreateEnquiryNoteDto, user: AuthenticatedUser){
    let enquiryData = await this.prisma.enquiry.findFirst({
      where:{
        id: enquiryId
      },
      include:{
        Leads: true
      }
    })
    return this.prisma.leadEnquiryFollowUp.create({
      data:{
        enquiryId: enquiryId,
        isConcern: createNote.isConcern,
        note: createNote.note,
        addedById: user.userId,
        leadId: (enquiryData && enquiryData.Leads) ? enquiryData.Leads.id : undefined
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

  findAllNotes(noteId: number){
    return this.prisma.leadEnquiryFollowUp.findMany({
      where:{
        enquiryId: noteId,
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


  assignEnquiry(enquiryId: number, asignPropertyDto: AssignEnquiryDto, user: AuthenticatedUser){
    return this.prisma.enquiry.update({
      where:{
        id: enquiryId,
      },
      data:{
        assignedToId: asignPropertyDto.assignedToId,
        assignedById: user.userId
      }
    })
  }

  removeEnquiry (enquiryId: number){
    return this.prisma.enquiry.update({
      where:{
        id: enquiryId
      },
      data:{
        isDeleted: true
      }
    })
  }


  async autoCreateLeadUsingEnquiry(createLeadDto: AutoCreateLeadFromEnquiryDto, user: AuthenticatedUser) {
    let enquiryData = await this.prisma.enquiry.findFirst({
      where:{
        id: createLeadDto.enquiryId,
        isDeleted: false
      },
      include:{
        Leads: true
      }
    })

    if(!enquiryData){
      throw {
        message: "Enquiry with the provided ID not found. It might have been removed from the system",
        statusCode: 400
      }
    }

    let leadData = enquiryData.Leads;
    if(leadData){
      if(leadData.isDeleted === false){
        throw {
          message: "You have already create a lead for this enquiry",
          statusCode: 400
        }
      }else{
        await this.prisma.leads.update({
          where:{
            id: leadData.id
          },
          data:{
            Enquiry:{
              disconnect: true
            }
          }
        })
      }
    }

    let newLeadData : Prisma.LeadsUncheckedCreateInput = {
      enquiryId: createLeadDto.enquiryId,
      projectTypeId: createLeadDto.projectTypeId,
      message: createLeadDto.message,
      submissionById: createLeadDto.submissionById,
      addedById: user.userId,
      assignedToId: (createLeadDto.assignedToId) ? createLeadDto.assignedToId : undefined,
      //xeroTenantId: createLeadDto.xeroTenantId,
      addedDate: new Date(),
      dueDateForSubmissions: (createLeadDto.dueDateForSubmissions) ? createLeadDto.dueDateForSubmissions : undefined
    };
    
      if(createLeadDto.clientId){
        let providedClientData = await this.prisma.client.findFirst({
          where:{
            id: createLeadDto.clientId,
            isDeleted: false
          }
        })

        if(!providedClientData){
          throw {
            message: "Provided client doesnot exist in the system",
            statusCode: 400
          }
        }

        if(providedClientData.type === ClientType.company){
          if(providedClientData.email === enquiryData.email){
            newLeadData.clientId = createLeadDto.clientId
          }else{
            let clientData = await this.upsertClient(enquiryData, ClientType.individual, providedClientData.id);
            newLeadData.clientId = clientData.id
          }
        }else{
          newLeadData.clientId = createLeadDto.clientId
        }

      }else{
      let clientData = await this.upsertClient(enquiryData, createLeadDto.clientType);
      newLeadData.clientId = clientData.id
    }

    await this.prisma.enquiry.update({
      where:{
        id: createLeadDto.enquiryId
      },
      data:{
        status: EnquiryStatus.Qualified,
        modifiedById: user.userId,
        modifiedDate: new Date()
      }
    })

    let leadDataNew = await this.prisma.leads.create({
      data: newLeadData,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })

      await this.prisma.leadEnquiryFollowUp.updateMany({
        where:{
          enquiryId: createLeadDto.enquiryId
        },
        data:{
          leadId: leadDataNew.id
        }
      })

      await this.prisma.enquiryAttachment.updateMany({
        where:{
          enquiryId: createLeadDto.enquiryId
        },
        data:{
          leadId: leadDataNew.id
        }
      })
      
      this.logger.log("Subscribing for notification");
      let emitterData = new NotificationEventDto({recordId: leadDataNew.id, moduleName: 'enquiryConfirmed'});
      this.eventEmitter.emit('notification.send', emitterData);
      
      return leadDataNew;
  }


  async upsertClient(enquiryData: Enquiry, clientType: ClientType, parentId ?: number){
    let clientData: Client;
    if(enquiryData && enquiryData.email){
      clientData = await this.prisma.client.findFirst({
        where:{
          OR:[
            {
              email: {
                contains: enquiryData.email,
                mode: 'insensitive'
              },
            }
          ],
          isDeleted: false
        }
      })
    }

    if(clientData){
     return clientData;
    }else{
      let newClient = await this.prisma.client.create({
        data:{
          name: enquiryData.name,
          email: (enquiryData?.email) ? enquiryData.email : undefined,
          phone: enquiryData.phone,
          type: clientType,
          phoneCode: enquiryData.phoneCode,
          companyId: (parentId) ? parentId : undefined,
        }
      })
      return newClient;
    }
  }

  async handleDocuments(enquiryDocuments: UploadEnquiryDocuments, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let enquiryData = await this.prisma.enquiry.findUnique({
      where: {
        id: enquiryDocuments.enquiryId
      },
      include:{
        Leads: true
      }
    })

    if (!enquiryData) {
      throw new NotFoundException({ message: "Enquiry with the provided id not Found", statusCode: 400 })
    }
    let insertData: Array<Prisma.EnquiryAttachmentUncheckedCreateInput> = files.map((ele, index) => {
      let newRecord : Prisma.EnquiryAttachmentUncheckedCreateInput = {
        title: ele.originalname,
        file:extractRelativePathFromFullPath(ele.path),
        mimeType: ele.mimetype,
        enquiryId: enquiryData.id,
        leadId: (enquiryData.Leads) ? enquiryData.Leads?.id : undefined,
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


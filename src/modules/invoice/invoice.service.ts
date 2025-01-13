import puppeteer from "puppeteer";
import * as fs from "fs";
import * as ejs from "ejs";
import { Injectable, Logger } from '@nestjs/common';
import { Organization, Prisma, Project } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import { MailService } from 'src/mail/mail.service';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { InvoiceStatusDto } from './dto/invoice-status.dto';
import { LeadsStatus, InvoiceStatus, MilestoneStatus, SupervisionPaymentSchedule, VAT_RATE } from 'src/config/constants';
import { ClientDefaultAttributes } from "../client/dto/client.dto";
import { ProjectDefaultAttributes } from "../project/dto/project.dto";
import { OrganizationDefaultAttributes } from "../organization/dto/organization.dto";
import { addDaysToDate, convertDate, extractIds, getEnumKeyByEnumValue, getTaxData, slugify } from "src/helpers/common";
import { getDynamicUploadPath } from "./dto/invoice.dto";
import { existsSync, mkdirSync } from "fs";
import { uploadFile } from "src/helpers/file-management";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { XeroProcessNames } from "../xero-accounting/process/xero.process.config";
import { CheckInvoiceDuplicacyDto } from "./dto/check-invoice-number-duplicacy.dto";
import { QuickUpdateInvoice } from "./dto/quick-update.dto";
import { CreateInvoiceNoteDto } from "./dto/create-invoice-note.dto";
import { UserDefaultAttributes } from "../user/dto/user.dto";
import { LeadsDefaultAttributes } from "../leads/dto/leads.dto";

@Injectable()
export class InvoiceService {

  private readonly logger = new Logger(InvoiceService.name);
  constructor(private prisma: PrismaService,
    private readonly mailService: MailService,
    @InjectQueue('xero') private xeroQueue: Queue
  ) {
  }

  async create(createDto: CreateInvoiceDto, user: AuthenticatedUser) {
    const { invoiceItems, milestoneIds, ...rest } = createDto;
    let project = await this.prisma.project.findFirstOrThrow({
      where: {
        id: createDto.projectId
      },
      include: {
        Lead: {
          select: LeadsDefaultAttributes
        },
        SubmissionBy: {
          select: OrganizationDefaultAttributes
        }
      }
    })

    if (!project.SubmissionBy) {
      throw {
        message: "Could not determine submission by company. Please update Submission By in the project eg: DAT, DAT Abu Dhabi or Luxedesign",
        statusCode: 404
      }
    }

    let totalAmount = 0;
    let vatAmount = 0;
    // invoiceItems.forEach((ele) => {
    //   totalAmount = totalAmount + (ele.quantity * ele.amount)
    // })

    let vatData = new Map<number, { rate: number }>();
    let invoiceLineItems: Array<Prisma.InvoiceItemUncheckedCreateInput> = []
    for (let i = 0; i < invoiceItems.length; i++) {
      let ele = invoiceItems[i];
      let lineAmount = (ele.quantity * ele.amount);
      let lineVatAmount = 0;
      totalAmount = totalAmount + lineAmount;
      if (ele.taxRateId) {
        let rate = 0;
        if (vatData.has(ele.taxRateId)) {
          rate = vatData.get(ele.taxRateId).rate;
        } else {
          let vt = await this.prisma.taxRate.findFirst({
            where: { id: ele.taxRateId }
          })
          rate = vt.rate;
          vatData.set(ele.taxRateId, { rate: rate });
        }
        lineVatAmount = (rate / 100) * lineAmount
        vatAmount += lineVatAmount;
      }
      invoiceLineItems.push({
        ...ele,
        taxAmount: lineVatAmount
      })
    }

    let totalAmountWithVat = totalAmount + vatAmount;
    let record = await this.prisma.invoice.create({
      data: {
        ...rest,
        addedById: user.userId,
        clientId: project.clientId,
        xeroTenantId: project.Lead?.xeroTenantId,
        subTotal: totalAmount,
        vatAmount: vatAmount,
        total: totalAmountWithVat,
        status: InvoiceStatus.generated,
        InvoiceItems: {
          createMany: {
            data: invoiceLineItems.map(({ id, ...rest }) => rest)
          }
        }
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })

    if (record && milestoneIds) {
      let milestoneToUpdate = [];
      if (Array.isArray(milestoneIds)) {
        milestoneToUpdate = milestoneIds
      } else {
        milestoneToUpdate = [milestoneIds]
      }
      if (milestoneToUpdate.length > 0) {
        await this.prisma.quotationMilestone.updateMany({
          where: {
            id: {
              in: milestoneToUpdate
            }
          },
          data: {
            status: MilestoneStatus.invoice_generated,
            invoiceId: record.id
          }
        })
      }
    }

    this.xeroQueue.add(XeroProcessNames.syncInvoice, {
      message: "Sync Invoice With Xero",
      data: record
    }, { removeOnComplete: true })

    return record;
  }

  findAll(pagination: Pagination, condition: Prisma.InvoiceWhereInput) {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.invoice.findMany({
      where: condition,
      skip: skip,
      take: take,
      include: {
        _count: {
          select: {
            InvoiceFollowUp: {
              where: {
                isDeleted: false
              }
            }
          }
        },
        InvoiceItems: true,
        QuotationMilestone: true,
        Project: {
          select: ProjectDefaultAttributes
        },
        Client: {
          select: ClientDefaultAttributes
        },
        InvoiceFollowUp: {
          where: {
            isDeleted: false
          },
          take: 1,
          orderBy: {
            addedDate: 'desc'
          }
        },
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.invoice.findUnique({
      where: {
        id: id
      },
      include: {
        InvoiceItems: {
          include: {
            Account: {
              select: {
                id: true,
                accountCode: true,
                title: true
              }
            },
            TaxRate: {
              select: {
                id: true,
                taxType: true,
                title: true
              }
            },
            Product: {
              select: {
                id: true,
                title: true,
                productCode: true
              }
            }
          }
        },
        QuotationMilestone: true,
        Quotation: {
          include: {
            QuotationMilestone: true
          }
        },
        Project: {
          select: {
            ...ProjectDefaultAttributes,
            SubmissionBy: {
              select: OrganizationDefaultAttributes
            }
          }
        },
        Client: {
          select: ClientDefaultAttributes
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateDto: UpdateInvoiceDto, user: AuthenticatedUser) {
    const { invoiceItems, milestoneIds, ...rest } = updateDto;
    let recordData = await this.findOne(id);
    if (recordData.status !== InvoiceStatus.generated) {
      throw {
        message: "You cannot modify the invoice once it is sent to client. Please mark as canceled and recreate the new invoice",
        statusCode: 400
      }
    }

    let updatedRecord = await this.prisma.invoice.update({
      data: {
        ...rest,
        modifiedById: user.userId,
        modifiedDate: new Date()
      },
      where: {
        id: id
      }
    })

    if (updatedRecord && milestoneIds) {
      let milestoneToUpdate = [];
      if (Array.isArray(milestoneIds)) {
        milestoneToUpdate = milestoneIds
      } else {
        milestoneToUpdate = [milestoneIds]
      }
      if (milestoneToUpdate.length > 0) {
        await this.prisma.quotationMilestone.updateMany({
          where: {
            id: {
              in: milestoneToUpdate
            }
          },
          data: {
            status: MilestoneStatus.invoice_generated,
            invoiceId: updatedRecord.id
          }
        })
      }
    }

    if (invoiceItems) {
      let allIds = [];
      invoiceItems.forEach((ele) => {
        if (ele.id) {
          allIds.push(ele.id)
        }
      })

      await this.prisma.invoiceItem.deleteMany({
        where: {
          invoiceId: updatedRecord.id,
          NOT: {
            id: {
              in: allIds
            }
          }
        }
      })

      let newMileStone = [];
      let vatData = new Map<number, { rate: number }>();
      for (let i = 0; i < invoiceItems.length; i++) {
        let ele = invoiceItems[i];
        let lineAmount = (ele.quantity * ele.amount);
        let lineVatAmount = 0;

        if (ele.taxRateId) {
          let rate = 0;
          if (vatData.has(ele.taxRateId)) {
            rate = vatData.get(ele.taxRateId).rate;
          } else {
            let vt = await this.prisma.taxRate.findFirst({
              where: { id: ele.taxRateId }
            })
            rate = vt.rate;
            vatData.set(ele.taxRateId, { rate: rate });
          }
          lineVatAmount = (rate / 100) * lineAmount
        }
        if (ele.id) {
          let t = this.prisma.invoiceItem.update({
            where: {
              id: ele.id
            },
            data: {
              invoiceId: updatedRecord.id,
              amount: ele.amount,
              quantity: ele.quantity,
              taxAmount: lineVatAmount,
              taxRateId: (ele.taxRateId) ? ele.taxRateId : undefined,
              productId: (ele.productId) ? ele.productId : undefined,
              accountId: (ele.accountId) ? ele.accountId : undefined,
              title: ele.title
            }
          })
          newMileStone.push(t)
        } else {
          let t = this.prisma.invoiceItem.create({
            data: {
              invoiceId: updatedRecord.id,
              amount: ele.amount,
              title: ele.title,
              quantity: ele.quantity,
              taxAmount: lineVatAmount,
              taxRateId: (ele.taxRateId) ? ele.taxRateId : undefined,
              productId: (ele.productId) ? ele.productId : undefined,
              accountId: (ele.accountId) ? ele.accountId : undefined,
            }
          })
          newMileStone.push(t)
        }
      }
      await Promise.all(newMileStone);
    }
    await this.adjustTotalAfterUpdate(updatedRecord.id);

    this.xeroQueue.add(XeroProcessNames.syncInvoice, {
      message: "Sync Invoice With Xero",
      data: updatedRecord
    }, { removeOnComplete: true })

    return this.findOne(updatedRecord.id);
  }

  async adjustTotalAfterUpdate(invoiceId: number) {
    let invoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoiceId: invoiceId
      }
    })

    let totalAmount = 0;
    let vatAmount = 0;
    invoiceItems.forEach((ele) => {
      totalAmount = totalAmount + (ele.quantity * ele.amount);
      vatAmount = vatAmount + ele.taxAmount
    })

    let totalAmountWithVat = totalAmount + vatAmount;
    return this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        subTotal: totalAmount,
        vatAmount: vatAmount,
        total: totalAmountWithVat
      }
    })
  }

  applyFilters(filters: InvoiceFiltersDto) {
    let condition: Prisma.InvoiceWhereInput = {
      isDeleted: false
    };
    if (Object.entries(filters).length > 0) {

      if (filters.__status) {
        condition = {
          ...condition, status: {
            in: filters.__status
          }
        }
      }


      if (filters.clientId) {
        condition = {
          ...condition, clientId: filters.clientId
        }
      }

      if (filters.hasConcerns) {
        condition = {
          ...condition,
          InvoiceFollowUp: {
            some: {
              isConcern: true,
              isResolved: false
            }
          }
        }
      }

      if (filters.id) {
        condition = {
          ...condition, id: filters.id
        }
      }

      if (filters.invoiceNumber) {
        condition = {
          ...condition, invoiceNumber: {
            contains: filters.invoiceNumber,
            mode: 'insensitive'
          }
        }
      }

      if (filters.projectTypeId) {
        condition = {
          ...condition, Project: {
            projectTypeId: filters.projectTypeId
          }
        }
      }

      if (filters.projectId) {
        condition = {
          ...condition, projectId: filters.projectId
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
    return condition
  }

  countTotalRecord(filters: Prisma.InvoiceWhereInput) {
    return this.prisma.invoice.count({
      where: filters
    })
  }

  async submitInvoice(invoiceId: number, user: AuthenticatedUser) {
    let recordData = await this.findOne(invoiceId);
    if (recordData.status !== InvoiceStatus.generated) {
      throw {
        message: "This invoice has already been submitted",
        statusCode: 400
      }
    }

    await this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        status: InvoiceStatus.sent,
        sentDate: new Date(),
        modifiedById: user.userId,
        QuotationMilestone: {
          updateMany: {
            where: {
              invoiceId: invoiceId
            },
            data: {
              status: MilestoneStatus.invoice_sent
            }
          }
        }
      }
    })

    this.xeroQueue.add(XeroProcessNames.updateInvoiceStatus, {
      message: "Sync Invoice Status With Xero",
      data: recordData
    }, { removeOnComplete: true })

    this.mailService.sendInvoiceToClient(recordData, user);
  }

  async markAsSent(invoiceId: number, user: AuthenticatedUser) {
    let recordData = await this.findOne(invoiceId);
    if (recordData.status !== InvoiceStatus.generated) {
      throw {
        message: "This invoice has already been submitted",
        statusCode: 400
      }
    }

    let updatedRecord = await this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        status: InvoiceStatus.sent,
        sentDate: new Date(),
        modifiedById: user.userId,
        QuotationMilestone: {
          updateMany: {
            where: {
              invoiceId: invoiceId
            },
            data: {
              status: MilestoneStatus.invoice_sent
            }
          }
        }
      }
    })

    this.xeroQueue.add(XeroProcessNames.updateInvoiceStatus, {
      message: "Sync Invoice Status With Xero",
      data: recordData
    }, { removeOnComplete: true })

    return updatedRecord;
  }

  async updateStatus(invoiceId: number, invoiceStatusDto: InvoiceStatusDto, user: AuthenticatedUser) {
    let recordData = await this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        status: invoiceStatusDto.status
      },
      include: {
        Project: {
          select: {
            id: true,
            onHold: true
          }
        }
      }
    })

    if (invoiceStatusDto.status === InvoiceStatus.paid) {
      await this.prisma.quotationMilestone.updateMany({
        where: {
          invoiceId: invoiceId
        },
        data: {
          status: MilestoneStatus.invoice_paid
        }
      })


      if (invoiceStatusDto.resumeProject && recordData.Project?.onHold) {
        await this.prisma.project.update({
          where: {
            id: recordData.Project.id
          },
          data: {
            onHold: false,
            comment: "Payment verified, project reactivated!",
            projectHoldById: user.userId,
          }
        })
      }

    } else if (invoiceStatusDto.status === InvoiceStatus.canceled) {
      await this.prisma.quotationMilestone.updateMany({
        where: {
          invoiceId: invoiceId
        },
        data: {
          status: MilestoneStatus.invoice_canceled
        }
      })
    }

    this.xeroQueue.add(XeroProcessNames.updateInvoiceStatus, {
      message: "Sync Invoice Status With Xero",
      data: recordData
    }, { removeOnComplete: true })

    return recordData;
  }

  removeInvoice(invoiceId: number, user: AuthenticatedUser) {
    return this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        isDeleted: true,
        modifiedById: user.userId,
        modifiedDate: new Date()
      }
    })
  }

  viewInvoicePdf(invoiceId: number) {
    return this.prisma.invoice.findUnique({
      where: {
        id: invoiceId
      },
      include: {
        QuotationMilestone: true,
        InvoiceItems: {
          include: {
            TaxRate: {
              select: {
                id: true,
                rate: true,
                title: true
              }
            }
          }
        },
        Client: {
          select: ClientDefaultAttributes
        },
        Project: {
          select: {
            SubmissionBy: true,
            Lead: {
              include: {
                Client: true,
                SubmissionBy: {
                  select: {
                    ...OrganizationDefaultAttributes,
                    taxRegistrationNumber: true,
                    address: true
                  }
                }
              }
            },
          }
        }
      }
    })
  }

  async generateInvoicePdf(invoiceId: number) {
    let invoiceData = await this.prisma.invoice.findUniqueOrThrow({
      where: {
        id: invoiceId
      },
      include: {
        Client: true,
        Project: {
          include: {
            SubmissionBy: true
          }
        },
        InvoiceItems: {
          include: {
            TaxRate: {
              select: {
                id: true,
                title: true,
                rate: true
              }
            }
          }
        }
      }
    })

    let clientData = invoiceData.Client;
    let submissionBy = invoiceData.Project?.SubmissionBy;
    const browser = await puppeteer.launch({ headless: true }); // or false

    const page = await browser.newPage();
    const pageData = await fs.promises.readFile("views/pdf-templates/invoice.ejs", 'utf-8');
    const renderedContent = ejs.render(pageData, {
      clientData: clientData,
      invoice: invoiceData,
      submissionBy: submissionBy,
      convertDate,
      taxData: getTaxData(invoiceData.InvoiceItems),
      addDaysToDate,
      getEnumKeyByEnumValue,
      SupervisionPaymentSchedule
    });
    // Set the content to render
    await page.setContent(renderedContent, { waitUntil: 'networkidle0', timeout: 10000 });
    // await page.waitForSelector('#puppetSelector');
    // await page.waitForNavigation();
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // Generate PDF from the rendered content
    let filename = "Invoice-" + slugify(clientData.name) + "-" + Date.now() + "__" + invoiceData.id + ".pdf";
    let fileLocation = getDynamicUploadPath() + "/";
    let __fileLocation = process.cwd() + "/" + fileLocation;
    if (!existsSync(fileLocation)) {
      mkdirSync(fileLocation, { recursive: true });
    }
    await page.pdf({ path: fileLocation + filename });
    await browser.close();
    const fileToUpload: Express.Multer.File = {
      fieldname: "",
      filename: filename,
      size: 0,
      encoding: 'utf-8',
      mimetype: "application/pdf",
      destination: fileLocation,
      path: __fileLocation + filename,
      originalname: filename,
      stream: undefined,
      buffer: undefined

    }
    await uploadFile(fileToUpload);
    await this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        file: fileLocation + filename
      }
    })

    return this.findOne(invoiceId);
  }


  async checkForDuplicacy(checkInvoiceDuplicacyDto: CheckInvoiceDuplicacyDto) {
    let condition: Prisma.InvoiceWhereInput = {
      invoiceNumber: checkInvoiceDuplicacyDto.invoiceNumber,
      isDeleted: false
    };

    if (checkInvoiceDuplicacyDto.excludeId) {
      condition = {
        ...condition,
        id: {
          not: checkInvoiceDuplicacyDto.excludeId
        }
      }
    }

    let recordData = await this.prisma.invoice.findFirst({
      where: condition
    })

    if (recordData) {
      return true
    } else {
      return false
    }
  }


  async prepareUniqueInvoiceNumber(projectId?: number) {

    let projectData: Project & { SubmissionBy: Partial<Organization> };
    if (projectId) {
      let projectData = await this.prisma.project.findFirst({
        where: {
          id: projectId
        },
        include: {
          SubmissionBy: {
            select: {
              organizationCode: true
            }
          }
        }
      })
    }

    let invoicePrefix = "INV-" + ((projectData && projectData.SubmissionBy) ? projectData.SubmissionBy.organizationCode : "");
    let condition: Prisma.InvoiceWhereInput = {
      isDeleted: false,
    }

    if (projectData && projectData.submissionById) {
      condition = {
        ...condition,
        Project: {
          submissionById: projectData.submissionById
        }
      }
    }
    let lastInvoice = await this.prisma.invoice.findFirst({
      where: condition,
      orderBy: {
        id: 'desc'
      }
    })

    if (lastInvoice) {
      if (lastInvoice.invoiceNumber) {
        let ids = extractIds(lastInvoice.invoiceNumber);
        if (ids.length > 0) {
          return invoicePrefix + String(ids[0] + 1).padStart(4, '0');
        } else {
          return invoicePrefix + String(lastInvoice.id + 1).padStart(4, '0');
        }
      } else {
        return invoicePrefix + String(lastInvoice.id + 1).padStart(4, '0');
      }
    } else {
      return invoicePrefix + String(1).padStart(4, '0');
    }
  }

  async quickUpdate(invoiceId: number, quickUpdate: QuickUpdateInvoice, user: AuthenticatedUser) {
    await this.prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        projectId: quickUpdate.projectId
      }
    })
    return this.findOne(invoiceId);
  }

  findAllNotes(invoiceId: number) {
    return this.prisma.invoiceFollowUp.findMany({
      where: {
        invoiceId: invoiceId,
        isDeleted: false
      },
      orderBy: {
        addedDate: 'desc'
      },
      include: {
        AddedBy: {
          select: {
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



  async addNote(invoiceId: number, createNote: CreateInvoiceNoteDto, user: AuthenticatedUser) {
    return this.prisma.invoiceFollowUp.create({
      data: {
        invoiceId: invoiceId,
        isConcern: createNote.isConcern,
        note: createNote.note,
        addedById: user.userId,
      }
    })
  }

  removeNote(noteId: number) {
    return this.prisma.invoiceFollowUp.update({
      where: {
        id: noteId
      },
      data: {
        isDeleted: true
      }
    })
  }

  markConcernAsResolved(noteId: number) {
    return this.prisma.invoiceFollowUp.update({
      where: {
        id: noteId
      },
      data: {
        isResolved: true
      }
    })
  }

}


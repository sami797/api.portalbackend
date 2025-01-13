import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Client, FileManagement, Invoice, Leads, Organization, Prisma, Project, ProjectMembers, Quotation, User } from '@prisma/client';
import { defaultYallahAlternateEmail, defaultYallahEmail, ejsTemplateDefaults, FileStatus, HOSTS } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { MailLogsFiltersDto } from './dto/mail-logs-filters.dto';
import { MailLogsPaginationDto } from './dto/mail-logs-pagination.dto';
import { MailLogsSortingDto } from './dto/mail-logs-sorting.dto';
import { SendPasswordResetLink } from './types/send-password-reset-link';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { createZipAndUpload, getFileStream } from 'src/helpers/file-management';
import internal from 'stream';
import { generateRandomName } from 'src/helpers/common';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private mailerService: MailerService, private prisma: PrismaService) { }

  resolveOrigin(origin: string) {
    return (HOSTS.activeFrontendDomains.includes(origin)) ? origin : HOSTS.defaultFrontendDomain;
  }

  async sendUserPasswordResetLink(emailData: SendPasswordResetLink) {

    let resetLink = this.resolveOrigin(emailData.origin) + "/reset-password/" + emailData.token;
    let context = {
      ...ejsTemplateDefaults,
      emailTitle: "Reset your password",
      hideFooter: true,
      firstName: emailData.user.firstName,
      url: resetLink,
    }
    /************************************ Log the email being sent ********************************************** ****************************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: emailData.user.email,
      subject: "Reset your DAT project portal Account Password",
      data: context as any,
      template: "./password-reset",
      calleFunction: calleFunctionName
    })
    /*********************************************************************************** Log the email being sent ****************************************************************************/

    await this.mailerService.sendMail({
      to: emailData.user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Reset your DAT project portal Account Password',
      template: './password-reset', // `.ejs` extension is appended automatically
      context: context,
    });
  }

  async sendOtpEmail(user: Partial<User>, otpCode: number) {

    let context = { // ✏️ filling curly brackets with content
      ...ejsTemplateDefaults,
      emailTitle: "OTP Code",
      hideFooter: true,
      firstName: user.firstName,
      otpCode: otpCode,
    }
    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: user.email,
      subject: "DAT Project Portal Account Verification Code",
      data: context as any,
      template: "./email-otp",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'DAT Project Portal Account Verification Code',
      template: './email-otp', // `.ejs` extension is appended automatically
      context: context,
    });
  }

  async logSentEmail(data: Prisma.MailSentLogsCreateInput) {
    await this.prisma.mailSentLogs.create({
      data: data
    })
  }


  findMailSentLogs(pagination: MailLogsPaginationDto, sorting: MailLogsSortingDto, condition: Prisma.MailSentLogsWhereInput) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.MailSentLogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    return this.prisma.mailSentLogs.findMany({
      where: condition,
      skip: skip,
      take: take,
      orderBy: __sorter,
    });
  }


  applyFilters(filters: MailLogsFiltersDto) {
    let condition: Prisma.MailSentLogsWhereInput = {}

    if (Object.entries(filters).length > 0) {

      if (filters.email) {
        condition = { ...condition, email: filters.email }
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

      if (filters.subject) {
        condition = {
          ...condition, subject: {
            contains: filters.subject,
            mode: 'insensitive'
          }
        }
      }


      if (filters.template) {
        condition = {
          ...condition, template: {
            contains: filters.template,
            mode: 'insensitive'
          }
        }
      }
    }

    return condition;
  }

  countTotalRecord(condition: Prisma.MailSentLogsWhereInput) {
    return this.prisma.mailSentLogs.count({
      where: condition
    })
  }

  async sendLeadsEnquiryEmail(user: Partial<User>, leads: Leads & { property: { slug: string; } }, link: string) {
    let unsubscribeLink = "";
    let propertyLink = link;
    let emailData = {
      ...ejsTemplateDefaults,
      emailTitle: "New Enquiry PropertyID: ",
      firstName: user.firstName,
      lastName: user.lastName,
      unsubscribeUrl: unsubscribeLink,
      leads: leads,
      propertyLink: propertyLink
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: user.email,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./email-leads",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './email-leads', // `.ejs` extension is appended automatically
      context: emailData
    });
  }

  async sendQuotationToClient(quotation: Quotation & { Lead: Partial<Leads> & { Client: Partial<Client> } & { SubmissionBy: Partial<Organization> } }, user: AuthenticatedUser) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: true,
      emailTitle: "Quotation - " + quotation.quoteNumber,
      clientData: quotation.Lead?.Client,
      lead: quotation.Lead,
      submissionBy: quotation.Lead?.SubmissionBy,
      quotation: quotation
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: emailData.clientData.email,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./quotation",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/
    let readStream: internal.Readable;
    if (quotation.file) {
      readStream = getFileStream(quotation.file);
    }
    const pathParts = quotation.file.split('/');
    const filename = pathParts[pathParts.length - 1];

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : emailData.clientData.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './quotation', // `.ejs` extension is appended automatically
      context: emailData,
      cc: (process.env.ENVIRONMENT === "development") ? defaultYallahAlternateEmail : user.userEmail,
      attachments: [{
        filename: filename,
        content: readStream,
        contentDisposition: 'attachment'
      }]
    });

  }

  async sendInvoiceToClient(invoice: Invoice & { Project: Partial<Project> & { SubmissionBy: Partial<Organization> } } & { Client: Partial<Client> }, user: AuthenticatedUser) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: true,
      emailTitle: "Invoice - " + invoice.invoiceNumber,
      clientData: invoice?.Client,
      project: invoice.Project,
      submissionBy: invoice.Project?.SubmissionBy
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: emailData.clientData.email,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./invoice",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/
    let readStream: internal.Readable;
    if (invoice.file) {
      readStream = getFileStream(invoice.file);
    }
    const pathParts = invoice.file.split('/');
    const filename = pathParts[pathParts.length - 1];
    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : emailData.clientData.email,
      // from: '"Support Team" <support@example.com>', // override default from
      from: `"DATP Finance Team" <${user.userEmail}>`,
      subject: emailData.emailTitle,
      template: './invoice', // `.ejs` extension is appended automatically
      context: emailData,
      cc: (process.env.ENVIRONMENT === "development") ? defaultYallahAlternateEmail : user.userEmail,
      attachments: [{
        filename: filename,
        content: readStream,
        contentDisposition: 'attachment'
      }]
    });

  }

  async sendQuotationNotification(quotation: Quotation & { Lead: Partial<Leads> & { Client: Partial<Client> } }, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Quotation Approved - " + quotation.quoteNumber,
      clientData: quotation.Lead?.Client,
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./quotation-approved-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/
    let readStream: internal.Readable;
    if (quotation.file) {
      readStream = getFileStream(quotation.file);
    }
    const pathParts = quotation.file.split('/');
    const filename = pathParts[pathParts.length - 1];

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './quotation-approved-notification', // `.ejs` extension is appended automatically
      context: emailData,
      attachments: [{
        filename: filename,
        content: readStream,
        contentDisposition: 'attachment'
      }]
    });

  }


  async sendMilestoneCompletedNotification(project: Partial<Project>, completedBy: Partial<User>, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Milestone Completed of Project - " + project.title,
      user: completedBy,
      project: project
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./quotation-milestone-completed-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './quotation-milestone-completed-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async sendEnquiryConfirmedNotification(lead: Partial<Leads>, client: Partial<Client>, confirmedBy: Partial<User>, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Enquiry Confirmed - LEAD-" + lead.id,
      user: confirmedBy,
      clientData: client,
      lead: lead
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./enquiry-confirmed-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './enquiry-confirmed-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }


  async sendQuotationFollowupNotification(userEmails: string | string[], quotationCount: number, salutation?: string,) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: quotationCount + " assigned quotations pending for approval or submission",
      quotationCount: quotationCount,
      salutation: (salutation) ? salutation : "Team"
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./quotation-followup-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './quotation-followup-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async sendNewProjectNotification(project: Partial<Project>, client: Partial<Client>, submissionBy: Partial<Organization>, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "New Project has been added to the portal -" + project.referenceNumber + " | " + project.title,
      clientData: client,
      submissionBy: submissionBy,
      project: project
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./new-project-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './new-project-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async sendProjectResumedNotification(project: Partial<Project>, client: Partial<Client>, submissionBy: Partial<Organization>, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Project Resumed -" + project.referenceNumber + " | " + project.title,
      clientData: client,
      submissionBy: submissionBy,
      project: project
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./project-resumed-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './project-resumed-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async sendProjectHoldNotification(project: Partial<Project>, client: Partial<Client>, submissionBy: Partial<Organization>, userEmails: string | string[]) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Project has been temporarily placed on hold -" + project.referenceNumber + " | " + project.title,
      clientData: client,
      submissionBy: submissionBy,
      project: project
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: (Array.isArray(userEmails)) ? userEmails.join(",") : userEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./project-hold-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : userEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './project-hold-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async sendProjectMemberNotification(project: Partial<Project>, projectRole: string, client: Partial<Client>, submissionBy: Partial<Organization>, user: Partial<User>) {
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "You have been added to a project -" + project.referenceNumber + " | " + project.title + " as "+ projectRole,
      clientData: client,
      submissionBy: submissionBy,
      project: project,
      projectRole: projectRole,
      user: user
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];

    this.logSentEmail({
      email: user.email,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./project-member-add-notification",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : user.email,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: emailData.emailTitle,
      template: './project-member-add-notification', // `.ejs` extension is appended automatically
      context: emailData,
    });

  }

  async shareProjectFilesToClient(project: Partial<Project> & { Client: Partial<Client>, ProjectClient: Partial<Client>[] }, files: Array<FileManagement>, user: AuthenticatedUser) {
    this.logger.log("Preparing data to share files to client")
    let emailData = {
      ...ejsTemplateDefaults,
      hideFooter: false,
      emailTitle: "Files Shared - Project:" + project.title,
      clientData: project?.Client,
      attatchZipLink: false,
      zipFileLink: "",
      zipFileName: ""
    }

    /************************************ Log the email being sent *************************************/
    const stack = new Error().stack;
    const calleFunctionName = stack.split('at ')[2].split(' ')[0];
    let allClientEmails = [project.Client.email];
    if (project.ProjectClient && project.ProjectClient.length > 0) {
      project.ProjectClient.forEach((ele) => {
        allClientEmails.push(ele.email)
      })
    }

    this.logSentEmail({
      email: (Array.isArray(allClientEmails)) ? allClientEmails.join(",") : allClientEmails,
      subject: emailData.emailTitle,
      data: emailData as any,
      template: "./share-file-to-client",
      calleFunction: calleFunctionName
    })
    /************************************ Log the email being sent *************************************/
    /** Email Attatchments */
    let attatchments = [];
    let allFilesKeys = [];
    let totalFileSize = 0;
    files.forEach((ele) => {
      totalFileSize = totalFileSize + ele.fileSize
      allFilesKeys.push(ele.path);
    })

    let totalFileSizeInMb = totalFileSize / 1024;
    if (totalFileSizeInMb < 22) {
      this.logger.log("Files size is lesser than threshold, sending in attatchment");
      files.forEach((ele) => {
        let readStream: internal.Readable;
        if (ele.path) {
          readStream = getFileStream(ele.path);
        }
        const pathParts = ele.path.split('/');
        const filename = pathParts[pathParts.length - 1];
        attatchments.push({
          filename: filename,
          content: readStream,
          contentDisposition: 'attachment'
        })
      })
    } else {
      let zipFileName = Date.now() + "-" + generateRandomName(20) + ".zip";
      let zipFilepath = "public/shared/" + project.slug + "/";
      if (!existsSync(zipFilepath)) {
        mkdirSync(zipFilepath, { recursive: true });
      }
      let filePath = zipFilepath + zipFileName;
      await createZipAndUpload(allFilesKeys, filePath);
      this.logger.log("Zipped created successfully, sending email...");
      emailData.attatchZipLink = true;
      emailData.zipFileLink = filePath;
      emailData.zipFileName = zipFileName;
    }

    await this.mailerService.sendMail({
      to: (process.env.ENVIRONMENT === "development") ? defaultYallahEmail : allClientEmails,
      // to: userEmails,
      // from: '"Support Team" <support@example.com>', // override default from
      cc: (process.env.ENVIRONMENT === "development") ? defaultYallahAlternateEmail : user.userEmail,
      subject: emailData.emailTitle,
      template: './share-file-to-client', // `.ejs` extension is appended automatically
      context: emailData,
      attachments: attatchments
    });
  }


}

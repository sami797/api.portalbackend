import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { ResourcesLocation, SUPER_ADMIN, TaskType } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { ReimbursementPermissionSet } from '../reimbursement/reimbursement.permissions';
import { CarReservationRequestPermissionSet } from '../car-reservation/car-reservation-request.permissions';
import { CashAdvancePermissionSet } from '../cash-advance/cash-advance.permissions';
import { LeaveRequestPermissionSet } from '../leave-request/leave-request.permissions';
import { BiometricsJobPermissionSet } from '../biometrics-job/biometrics-job.permissions';
import { InvoicePermissionSet } from '../invoice/invoice.permissions';
import { OrganizationPermissionSet } from '../organization/organization.permissions';
import { QuotationPermissionSet } from '../quotation/quotation.permissions';
import { ProjectPermissionSet } from '../project/project.permissions';
import { TaskPermissionSet } from '../task/task.permissions';
import { UserPermissionSet } from '../user/user.permissions';
import { LeadsPermissionSet } from '../leads/leads.permissions';
import { EnquiryPermissionSet } from '../enquiry/enquiry.permissions';
import { TransactionPermissionSet } from '../transactions/transactions.permissions';

@Injectable()
export class ResourcesService extends AuthorizationService {
    constructor(protected readonly prisma: PrismaService) {
        super(prisma)
    }

    async checkResourcePermission(user: AuthenticatedUser, key: string, resourceType: keyof typeof ResourcesLocation) {
        switch (resourceType) {
            case 'car-reservation-request': return this.carReservationRequestFilePermission(user, key);
            case "biometrics-bulk-upload": return this.biometricsBulkUploadFilePermission(user, key);;
            case "cash-advance": return this.cashAdvanceRequestFilePermission(user, key);;
            case "invoice": return this.invoiceFilePermission(user, key);;
            case "leave-request": return this.leaveRequestFilePermission(user, key);;
            case "organization": return this.organizationFilePermission(user, key);;
            case "projects": return this.projectsFilePermission(user, key);;
            case "quotation": return this.quotationtFilePermission(user, key);;
            case "reimbursements": return this.reimbursementFilePermission(user, key);;
            case "task": return this.taskFilePermission(user, key);;
            case "user": return this.userFilePermission(user, key);;
            case "enquiry": return this.enquiryFilePermission(user, key);
            case "permits": return this.projectsFilePermission(user, key);
            case "transaction": return this.transactionFilePermission(user, key);
            case 'selfie': return true; //open to any logged in user
            case 'payroll': return true //TODO: need to find logic who can view these files;
            default: throw {
                message: "Could not determine resource type.",
                statusCode: 400
            }
        }
    }

    private async carReservationRequestFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[CarReservationRequestPermissionSet.HR_APPROVAL]>(user, [CarReservationRequestPermissionSet.HR_APPROVAL])
        if (permissions.carReservationRequestHRApproval) return true;
        let record = await this.prisma.carReservationRequest.findFirst({
            where: {
                Attachments: { some: { file: filePath } },
                requestById: user.userId
            },
            select: { id: true }
        })
        if (record) return true
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async biometricsBulkUploadFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[BiometricsJobPermissionSet.READ]>(user, [BiometricsJobPermissionSet.READ])
        if (permissions.readBiometricsJob) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async cashAdvanceRequestFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL]>(user, [CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL])
        if (permissions.cashAdvanceFinanceApproval || permissions.cashAdvanceHRApproval) {
            return true;
        }

        let record = await this.prisma.cashAdvanceRequest.findFirst({
            where: {
                Attachments: { some: { file: filePath } },
                requestById: user.userId
            },
            select: { id: true }
        })
        if (record) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async invoiceFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[InvoicePermissionSet.READ]>(user, [InvoicePermissionSet.READ])
        if (permissions.readInvoice) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async transactionFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[TransactionPermissionSet.READ]>(user, [TransactionPermissionSet.READ])
        if (permissions.readTransaction) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async leaveRequestFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[LeaveRequestPermissionSet.HR_APPROVAL]>(user, [LeaveRequestPermissionSet.HR_APPROVAL])
        if (permissions.leaveRequestHRApproval) {
            return true;
        }

        let record = await this.prisma.leaveRequest.findFirst({
            where: {
                Attachments: {
                    some: {
                        file: filePath
                    }
                }
            },
            select: {
                requestById: true,
                RequestBy: {
                    select: {
                        id: true,
                        managerId: true
                    }
                }
            }
        })

        if (!record) {
            throw {
                message: "Record Not Found",
                statusCode: 404
            }
        }

        if (record.requestById === user.userId) return true;
        if (user.userId === record.RequestBy?.managerId) {
            return true
        }

        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async organizationFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[OrganizationPermissionSet.READ]>(user, [OrganizationPermissionSet.READ])
        if (permissions.readOrganization) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async projectsFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(user, [ProjectPermissionSet.REAL_ALL_PROJECT])
        if (permissions.readAllProject) { return true; }
        let record = await this.prisma.project.findFirst({
            where: {
                Resources: { some: { path: {
                    equals: filePath,
                    mode: 'insensitive'
                } } },
                AND: {
                    OR: [
                        { ProjectMembers: { some: { userId: user.userId } } },
                        { addedById: user.userId }
                    ]
                }
            },
            select: { id: true }
        }) 

        if (record) return true;
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async quotationtFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[QuotationPermissionSet.READ]>(user, [QuotationPermissionSet.READ])
        if (permissions.readQuotation) return true;
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async reimbursementFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[ReimbursementPermissionSet.FINANCE_APPROVAL, ReimbursementPermissionSet.HR_APPROVAL]>(user, [ReimbursementPermissionSet.FINANCE_APPROVAL, ReimbursementPermissionSet.HR_APPROVAL])
        if (permissions.reimbursementFinanceApproval || permissions.reimbursementHRApproval) { return true; }
        let record = await this.prisma.reimbursement.findFirst({
            where: {
                ReimbursementReceipt: { some: { file: filePath } },
                requestById: user.userId
            },
            select: { id: true }
        })
        if (record) return true
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async taskFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[TaskPermissionSet.READ_ALL_TASK, TaskPermissionSet.TECH_SUPPORT]>(user, [TaskPermissionSet.READ_ALL_TASK, TaskPermissionSet.TECH_SUPPORT])
        if (permissions.readAllTask) { return true; }

        if(permissions.manageTechSupportTask){
            let record = await this.prisma.task.findFirst({
                where:{
                    type: TaskType.techSupport,
                    Resources: { some: { path: {
                        equals: filePath,
                        mode: 'insensitive'
                    } } }
                },
                select:{id: true}
            })
            if (record) return true;
        }
        
        let record = await this.prisma.task.findFirst({
            where: {
                Resources: { some: { path: {
                    equals: filePath,
                    mode: 'insensitive'
                } } },
                AND: {
                    OR: [
                        { TaskMembers: { some: { userId: user.userId } } },
                        { addedById: user.userId }
                    ]
                }
            },
            select: { id: true }
        })
        if (record) return true;
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }

    private async userFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[UserPermissionSet.MANAGE_ALL]>(user, [UserPermissionSet.MANAGE_ALL])
        if (permissions.manageAllUser) { return true; }
        let record = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { id: user.userId },
                    { managerId: user.userId }
                ]
            },
            select: { id: true }
        })
        if (record) return true;
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }
    private async enquiryFilePermission(user: AuthenticatedUser, filePath: string) {
        if (user.roles.slugs.includes(SUPER_ADMIN)) { return true; }
        let permissions = await this.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.READ, LeadsPermissionSet.READ, EnquiryPermissionSet.READ]>(user, [ProjectPermissionSet.READ, LeadsPermissionSet.READ, EnquiryPermissionSet.READ])
        if (permissions.readProject || permissions.readEnquiry || permissions.readLeads) { return true; }
        throw {
            message: "Forbidden resource",
            statusCode: 403
        }
    }
}

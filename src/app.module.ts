import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './authentication/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { BlogsCategoryModule } from './modules/blogs-category/blogs-category.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CountryModule } from './modules/country/country.module';
import { FaqsCategoryModule } from './modules/faqs-category/faqs-category.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { RoleModule } from './modules/role/role.module';
import { SitePagesContentModule } from './modules/site-pages-content/site-pages-content.module';
import { SitePagesSectionModule } from './modules/site-pages-section/site-pages-section.module';
import { SitePagesModule } from './modules/site-pages/site-pages.module';
import { StaticPageSeoModule } from './modules/static-page-seo/static-page-seo.module';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma.module';
import { AuthoritiesModule } from './modules/authorities/authorities.module';
import { DepartmentModule } from './modules/department/department.module';
import { ProjectModule } from './modules/project/project.module';
import { ProjectStateModule } from './modules/project-state/project-state.module';
import { ProjectTypeModule } from './modules/project-type/project-type.module';
import { SystemModulesModule } from './modules/system-modules/system-modules.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { DiaryModule } from './modules/diary/diary.module';
import { TaskModule } from './modules/task/task.module';
import { ProjectComponentsModule } from './modules/project-components/project-components.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EnquiryModule } from './modules/enquiry/enquiry.module';
import { ReimbursementModule } from './modules/reimbursement/reimbursement.module';
import { CashAdvanceModule } from './modules/cash-advance/cash-advance.module';
import { LeadsModule } from './modules/leads/leads.module';
import { QuotationModule } from './modules/quotation/quotation.module';
import { LeaveRequestModule } from './modules/leave-request/leave-request.module';
import { CarReservationModule } from './modules/car-reservation/car-reservation-request.module';
import { CompanyAssetModule } from './modules/company-asset/company-asset.module';
import { ClientModule } from './modules/client/client.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { BiometricsModule } from './modules/biometrics/biometrics.module';
import { BiometricsJobModule } from './modules/biometrics-job/biometrics-job.module';
import { REDIS_DB_NAME } from './config/constants';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { BulkUploadFormatModule } from './modules/bulk-upload-format/bulk-upload-format.module';
import { FileConvertorModule } from './modules/file-convertor/file-convertor.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PublicHolidayModule } from './modules/public-holiday/public-holiday.module';
import { AlertsTypeModule } from './modules/alerts-type/alerts-type.module';
import { UserAlertsSettingModule } from './modules/user-alerts-setting/user-alerts-setting.module';
import { LeaveTypeModule } from './modules/leave-type/leave-type.module';
import { DashboardElementsModule } from './modules/dashboard-elements/dashboard-elements.module';
import { PermitsModule } from './modules/permits/permits.module';
import { ChatModule } from './modules/chat/chat.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { XeroAccountingModule } from './modules/xero-accounting/xero-accounting.module';
import { PayrollCycleModule } from './modules/payroll-cycle/payroll-cycle.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisService } from './modules/redis/redis.service';
import { LeaveCreditModule } from './modules/leave-credit/leave-credit.module';
import { AccountModule } from './modules/account/account.module';
import { ProductModule } from './modules/product/product.module';
import { TaxRateModule } from './modules/tax-rate/tax-rate.module';
import { BrandingThemeModule } from './modules/branding-theme/branding-theme.module';
import { WorkingHoursModule } from './modules/working-hours/working-hours.module';
import { NotesModule } from './notes/notes.module';

import { PaymentTermsModule } from './payment-terms/payment-terms.module';




@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot(REDIS_DB_NAME,{
      redis: {
        host: 'localhost',
        port: 6379,
        password: "ASD67adkjad76788ASD",
        db: Number(process.env.REDIS_DB)
        // username: "yallahproperty",
      },
    }),
   
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    AuthorizationModule,
    SystemLogsModule,
    OrganizationModule,
    BlogsModule,
    BlogsCategoryModule,
    CountryModule,
    FaqsCategoryModule,
    FaqsModule,
    RoleModule,
    SitePagesModule,
    SitePagesSectionModule,
    SitePagesContentModule,
    StaticPageSeoModule,
    SystemModulesModule,
    AuthoritiesModule,
    DepartmentModule,
    ProjectTypeModule,
    ProjectStateModule,
    ProjectModule,
    PermissionsModule,
    ResourcesModule,
    DiaryModule,
    TaskModule,
    ProjectComponentsModule,
    NotificationModule,
    EnquiryModule,
    LeadsModule,
    ReimbursementModule,
    CashAdvanceModule,
    QuotationModule,
    LeaveRequestModule,
    CarReservationModule,
    CompanyAssetModule,
    ClientModule,
    InvoiceModule,
    BiometricsModule,
    BiometricsJobModule,
    BulkUploadFormatModule,
    FileConvertorModule,
    FeedbackModule,
    AttendanceModule,
    PublicHolidayModule,
    AlertsTypeModule,
    UserAlertsSettingModule,
    LeaveTypeModule,
    DashboardElementsModule,
    PermitsModule,
    ChatModule,
    TransactionsModule,
    XeroAccountingModule,
    PayrollCycleModule,
    PayrollModule,
    LeaveCreditModule,
    AccountModule,
    ProductModule,
    TaxRateModule,
    BrandingThemeModule,
    WorkingHoursModule,
    NotesModule,
    PaymentTermsModule,
 

  ],
  controllers: [AppController], 
  providers: [AppService, RedisService],
  
})
export class AppModule { }

import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req, Logger } from '@nestjs/common';
import { DashboardElementsService } from './dashboard-elements.service';
import { CreateDashboardElementDto } from './dto/create-dashboard-element.dto';
import { UpdateDashboardElementDto } from './dto/update-dashboard-element.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { DashboardElementResponseObject, DashboardElementResponseArray, DashboardElementsSet, DashboardElementSlugs, DashboardElementSlugTypes } from './dto/dashboard-element.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { DashboardElementPermissionSet } from './dashboard-elements.permissions';
import { DashboardElementFilters } from './dto/dashboard-element-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { DashboardAuthorizationService } from './dashboard-elements.authorization.service';
import { TypeFromEnumValues } from 'src/helpers/common';
import { ProjectPermissionSet } from '../project/project.permissions';
import { ProjectFiltersDto } from './dto/dashboard-project-filters.dto';
import { KnownProjectStatus } from 'src/config/constants';
import { ReimbursementPermissionSet } from '../reimbursement/reimbursement.permissions';
import { CashAdvancePermissionSet } from '../cash-advance/cash-advance.permissions';
import { LeaveRequestPermissionSet } from '../leave-request/leave-request.permissions';
import { EnquiryPermissionSet } from '../enquiry/enquiry.permissions';
const moduleName = "dashboard-elements";

@ApiTags("dashboard-elements")
@Controller('dashboard-elements')
export class DashboardElementsController {
  private readonly logger = new Logger(DashboardElementsController.name);
  constructor(private readonly dashboardElementsService: DashboardElementsService, private readonly authorizationService: DashboardAuthorizationService) { }

  @CheckPermissions(DashboardElementPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DashboardElementResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateDashboardElementDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.dashboardElementsService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DashboardElementResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: DashboardElementFilters): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.dashboardElementsService.applyFilters(filters);
      appliedFilters = { ...appliedFilters, isPublished: true };
      let data = await this.dashboardElementsService.findAll(appliedFilters);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DashboardElementResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('get-dashboard-content')
  async getDashboardContent(
    @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.dashboardElementsService.findDashboardElementsOfUser(req.user);
      let elementSlugs = data.map((ele) => ele.DashboardElement.slug) as Array<DashboardElementSlugTypes>;
      let permissionsRequired: TypeFromEnumValues<typeof DashboardElementsSet>[] = [];
      elementSlugs.forEach((ele) => {
        let permission = DashboardElementsSet[ele];
        if (permission && !permissionsRequired.includes(permission)) {
          permissionsRequired.push(permission)
        }
      })

      let allPromises = [];
      let responseData: Partial<{ [key in DashboardElementSlugTypes]: {
        fetchFromAPI: boolean,
        data: any
      } }> = {}
      let userPermissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[...typeof permissionsRequired, ProjectPermissionSet.REAL_ALL_PROJECT, ReimbursementPermissionSet.FINANCE_APPROVAL,  ReimbursementPermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL, CashAdvancePermissionSet.HR_APPROVAL, LeaveRequestPermissionSet.HR_APPROVAL, EnquiryPermissionSet.READ_ALL ]>(req.user, [...permissionsRequired, ProjectPermissionSet.REAL_ALL_PROJECT, ReimbursementPermissionSet.FINANCE_APPROVAL,  ReimbursementPermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL, CashAdvancePermissionSet.HR_APPROVAL, LeaveRequestPermissionSet.HR_APPROVAL, EnquiryPermissionSet.READ_ALL]);
      if (userPermissions.readProject) {
        if (elementSlugs.includes(DashboardElementSlugs.active_projects)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters).then((data) => {
            responseData.active_projects = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Active Projects", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.delayed_projects)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false, delayed: true}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.delayed_projects = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Delayed Projects", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.new_project)) {
          let _7daysAgo = new Date();
          _7daysAgo.setDate(_7daysAgo.getDate() - 7);
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false, fromDate: _7daysAgo, projectStateSlugs: [KnownProjectStatus.new]}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.new_project = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching New Projects", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.ready_for_submission)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false, projectStateSlugs: [KnownProjectStatus.ready_for_submission]}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.ready_for_submission = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Ready for Submission Projects", err?.message);
          }))
        }
        if (elementSlugs.includes(DashboardElementSlugs.on_hold_projects)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false,  onHold: true}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.on_hold_projects = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Ready for Submission Projects", err?.message);
          }))
        }
        if (elementSlugs.includes(DashboardElementSlugs.closed_projects)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: true}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.closed_projects = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Ready for Submission Projects", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.approved_projects)) {
          let activeProjectFilters: ProjectFiltersDto = {isClosed: false, projectStateSlugs: [KnownProjectStatus.approved]}
          let appliedFilters = this.dashboardElementsService.applyProjectFilters(activeProjectFilters, req.user, userPermissions.readAllProject);
          allPromises.push(this.dashboardElementsService.findAllProjects(appliedFilters, activeProjectFilters).then((data) => {
            responseData.approved_projects = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err => {
            this.logger.log("Some error while fetching Approved Projects", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.pending_project_as_support_engineer)) {
          allPromises.push(this.dashboardElementsService.findPendingProject_dashboard(req.user, 'supportEngineers').then((data) => {
            responseData.pending_project_as_support_engineer = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Pending Project as Support Enginner", err?.message);
          }))
        }

        if (elementSlugs.includes(DashboardElementSlugs.pending_project_as_project_incharge)) {
          allPromises.push(this.dashboardElementsService.findPendingProject_dashboard(req.user, 'projectIncharge').then((data) => {
            responseData.pending_project_as_project_incharge = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Pending Project as Project Incharge", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.all_tasks)){
        responseData.all_tasks = {
          fetchFromAPI: true,
          data: null
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.notification)){
        responseData.notification = {
          fetchFromAPI: true,
          data: null
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_quotations)){
        if(userPermissions.readQuotation){
          allPromises.push(this.dashboardElementsService.findActiveQuotation().then((data) => {
            responseData.active_quotations = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Active Quotations", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.permits_expiring)){
        if(userPermissions.readPermit){
          allPromises.push(this.dashboardElementsService.findPermitExpiring().then((data) => {
            responseData.permits_expiring = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Expiring Permits", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_employees)){
        if(userPermissions.readUser){
          allPromises.push(this.dashboardElementsService.findActiveEmployees().then((data) => {
            responseData.active_employees = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Active Employees", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.government_fees_to_collect)){
        if(userPermissions.readTransaction){
          allPromises.push(this.dashboardElementsService.findGovernmentFeesToCollect().then((data) => {
            responseData.government_fees_to_collect = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Government Fees To Collect", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.pending_invoices)){
        if(userPermissions.readInvoice){
          allPromises.push(this.dashboardElementsService.findActiveInvoices().then((data) => {
            responseData.pending_invoices = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Pending Invoices", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_leads)){
        if(userPermissions.readLeads){
          allPromises.push(this.dashboardElementsService.findActiveLeads().then((data) => {
            responseData.active_leads = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Active Leads", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_enquiries)){
        if(userPermissions.readEnquiry){
          allPromises.push(this.dashboardElementsService.findActiveEnquiry(req.user, userPermissions.readAllEnquiry).then((data) => {
            responseData.active_enquiries = {
              fetchFromAPI: false,
              data: data
            }
          }).catch(err =>{
            this.logger.log("Some error while fetching Active Enquiries", err?.message);
          }))
        }
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_reimbursement)){
        allPromises.push(this.dashboardElementsService.findActiveReimbursement(req.user, {reimbursementHRApproval: userPermissions.reimbursementHRApproval, reimbursementFinanceApproval: userPermissions.reimbursementFinanceApproval}).then((data) => {
          responseData.active_reimbursement = {
            fetchFromAPI: false,
            data: data
          }
        }).catch(err =>{
          this.logger.log("Some error while fetching Active Reimbursements", err?.message);
        }))
      }

      if(elementSlugs.includes(DashboardElementSlugs.active_cash_advance_request)){
        allPromises.push(this.dashboardElementsService.findActiveCashAdvanceRequest(req.user, {cashAdvanceHRApproval: userPermissions.cashAdvanceHRApproval, cashAdvanceFinanceApproval: userPermissions.cashAdvanceFinanceApproval}).then((data) => {
          responseData.active_cash_advance_request = {
            fetchFromAPI: false,
            data: data
          }
        }).catch(err =>{
          this.logger.log("Some error while fetching Active Reimbursements", err?.message);
        }))
      }


      if(elementSlugs.includes(DashboardElementSlugs.active_leave_request)){
        allPromises.push(this.dashboardElementsService.findActiveLeaveRequest(req.user, {leaveRequestHRApproval: userPermissions.leaveRequestHRApproval}).then((data) => {
          responseData.active_leave_request = {
            fetchFromAPI: false,
            data: data
          }
        }).catch(err =>{
          this.logger.log("Some error while fetching Active Reimbursements", err?.message);
        }))
      }

      await Promise.all(allPromises);

      return { message: `Dashboard content fetched Successfully`, statusCode: 200, data: {
        elements: elementSlugs,
        content: responseData
      } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DashboardElementPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DashboardElementResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: DashboardElementFilters): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.dashboardElementsService.applyFilters(filters);
      let data = await this.dashboardElementsService.findAll(appliedFilters);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(DashboardElementPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: DashboardElementResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateDto: UpdateDashboardElementDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.dashboardElementsService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DashboardElementPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: DashboardElementResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.dashboardElementsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DashboardElementPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: DashboardElementResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.dashboardElementsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}

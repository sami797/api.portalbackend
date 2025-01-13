import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SystemLogsPermissionSet } from './system-logs.permissions';
import { ApiOperation } from '@nestjs/swagger';
import { SystemLogsFiltersDto } from './dto/system-logs-filters.dto';
import { SystemLogsPaginationDto } from './dto/system-logs-pagination.dto';
import { SystemLogsSortingDto } from './dto/system-logs-sorting.dto';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';

@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}


  @CheckPermissions(SystemLogsPermissionSet.READ_LOGS)
  @ApiOperation({summary: "Finds Systems  history"})
  @Get('readSystemLogs')
  async readSystemLogs(
    @Query() filters: SystemLogsFiltersDto,
    @Query() pagination: SystemLogsPaginationDto,
    @Query() sorting: SystemLogsSortingDto,
    ) : Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.systemLogsService.applyFilters(filters);
      let dt = this.systemLogsService.findSystemLogs(pagination, sorting, filtersApplied);
      let tCount = this.systemLogsService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt,tCount]);
      let pageCount =  Math.floor(totalCount/ pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1 );
      return { message: `System logs fetched successfully`, statusCode: 200, data: data,
      meta: {
        page: pagination.page, 
        perPage: pagination.perPage,
        total: totalCount, 
        pageCount: pageCount
      }
    }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}

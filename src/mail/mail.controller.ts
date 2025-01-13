import { Controller, Get, HttpException, Query, Render } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/authentication/public-metadata';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { MailLogsFiltersDto } from './dto/mail-logs-filters.dto';
import { MailLogsPaginationDto } from './dto/mail-logs-pagination.dto';
import { MailLogsSortingDto } from './dto/mail-logs-sorting.dto';
import { MailPermissionSet } from './mail.permissions';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {

  constructor(private readonly mailService: MailService){}


  @CheckPermissions(MailPermissionSet.READ_LOGS)
  @ApiOperation({summary: "Finds Mails Sent history"})
  @Get('readMailSentLogs')
  async readMailSentLogs(
    @Query() filters: MailLogsFiltersDto,
    @Query() pagination: MailLogsPaginationDto,
    @Query() sorting: MailLogsSortingDto,
    ) : Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.mailService.applyFilters(filters);
      let dt = this.mailService.findMailSentLogs(pagination, sorting, filtersApplied);
      let tCount = this.mailService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt,tCount]);
      let pageCount =  Math.floor(totalCount/ pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1 );
      return { message: `Mail logs fetched successfully`, statusCode: 200, data: data,
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

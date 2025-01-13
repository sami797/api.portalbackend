import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { PayrollProcessorService } from './process/payroll.processor.service';
import { PayrollProcessor } from './process/payroll.processor';
import { PayrollAuthorizationService } from './payroll.authorization.service';
import { AttendanceService } from '../attendance/attendance.service';
import { ExcelService } from '../file-convertor/excel.service';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'payroll',
      configKey: REDIS_DB_NAME,
    }),
    BullModule.registerQueue({
      name: 'attendance',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollProcessor, PayrollProcessorService, PayrollAuthorizationService, AttendanceService, ExcelService]
})
export class PayrollModule {}

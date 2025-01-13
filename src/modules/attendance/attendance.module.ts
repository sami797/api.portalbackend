import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { AttendanceProcessorService } from './process/attendance.processor.service';
import { AttendanceProcessor } from './process/attendance.processor';
import { AttendanceCronJob } from './attendance.cronjob';
import { AttendanceAuthorizationService } from './attendance.authorization.service';
import { ExcelService } from '../file-convertor/excel.service';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'attendance',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceProcessorService, AttendanceProcessor, AttendanceCronJob, AttendanceAuthorizationService, ExcelService]
})
export class AttendanceModule {}

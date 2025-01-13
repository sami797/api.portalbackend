import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AttendanceProcessorService } from './attendance.processor.service';

@Processor('attendance')
export class AttendanceProcessor {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly attendanceProcessorService: AttendanceProcessorService){}

  @Process('prepareAttendanceReport')
  async prepareAttendanceReport(job: Job) {
    try{
        // await this.attendanceProcessorService.prepareAttendanceReport();
        await this.attendanceProcessorService.bulkProcessAttendance(new Date());
    }catch(err){
        console.log("Attendance Process Error", err.message)
    }
  }

  @Process('prepareBulkAttendanceReport')
  async prepareBulkAttendanceReport(job: Job) {
    try{
        await this.attendanceProcessorService.bulkProcessAttendance(new Date());
    }catch(err){
        console.log("Bulk Attendance Process Error", err.message)
    }
  }

  @Process()
  globalHandler(job: Job) {
    this.logger.error('No listners were provided, fall back to default', job.data);
  }
}

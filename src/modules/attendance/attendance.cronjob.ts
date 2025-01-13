
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';


@Injectable()
export class AttendanceCronJob {
    private readonly logger = new Logger(AttendanceCronJob.name);
    constructor(@InjectQueue('attendance') private attendanceQueue: Queue, ) {}

    @Cron('0 1 * * *')
    async prepareAttendanceReport() {
        this.logger.debug("Called every day at 01:00AM to find user attendance");
        this.attendanceQueue.add('prepareAttendanceReport',{
            message: "Start Preparing Attendance Report"
          },{removeOnComplete: true})
    }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { NotificationEventDto } from './dto/notification.dto';


@Injectable()
export class NotificationCronJob {
    private readonly logger = new Logger(NotificationCronJob.name);
    constructor(@InjectQueue('notification') private notificationQueue: Queue, ) {}

    @Cron('0 7 */3 * *')
    async senddailyNotification() {
        this.logger.debug("Called every day at 07:00AM to find user attendance");
        this.logger.log("Subscribing for notification");
        let notificationData = new NotificationEventDto({recordId: 1, moduleName: 'dailyNotification'});
        this.notificationQueue.add('sendNotification',{
            message: "Send Notification on the basis of module name",
            data: notificationData
          },{removeOnComplete: true, delay: 5000})
    }
}
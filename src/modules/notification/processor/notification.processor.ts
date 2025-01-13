import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationProcessorService } from './notification.processor.service';
import { NotificationEventDto } from '../dto/notification.dto';

@Processor('notification')
export class NotificationProcessor {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly notificationProcessorService: NotificationProcessorService) { }


  @Process('sendNotification')
  async sendNotification(job: Job<{ data: NotificationEventDto }>) {
    this.logger.log("Request to send Notification received");
    let eventData = job.data?.data;
    if (!eventData || !eventData.moduleName || !eventData.recordId) return false;
    try {
      if (this.notificationProcessorService.isProcessing === false) {
        this.logger.log("Starting Notification Job");
        this.notificationProcessorService.isProcessing = true;
        this.notificationProcessorService.activeJob = eventData;
        await this.notificationProcessorService.sendNotification(eventData);
      } else {
        this.notificationProcessorService.jobQueue.push(eventData);
        this.logger.log("Notification added on queue",this.notificationProcessorService.jobQueue);
      }
    } catch (err) {
      this.logger.error("Send Notification Error", err.message)
    }
  }

  @Process()
  globalHandler(job: Job) {
    this.logger.error('No listners were provided, fall back to default', job.data);
  }
}

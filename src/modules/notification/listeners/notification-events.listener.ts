import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { NotificationEventDto } from '../dto/notification.dto';

@Injectable()
export class NotificationEventListener {
  constructor(
    @InjectQueue('notification') private notificationQueue: Queue
  ){}
  @OnEvent('notification.send')
  async sendNotification(event: NotificationEventDto) {
    console.log("Send Notification Event Fired");
    this.notificationQueue.add('sendNotification',{
      message: "Send Notification on the basis of module name",
      data: event
    },{removeOnComplete: true, delay: 5000})
  }
}
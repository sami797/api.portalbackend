import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEventListener } from './listeners/notification-events.listener';
import { NotificationProcessorService } from './processor/notification.processor.service';
import { NotificationProcessor } from './processor/notification.processor';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { MailService } from 'src/mail/mail.service';
import { NotificationCronJob } from './notification.cronjob';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'notification',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationEventListener, NotificationProcessorService, NotificationProcessor, MailService, NotificationCronJob]
})
export class NotificationModule {}

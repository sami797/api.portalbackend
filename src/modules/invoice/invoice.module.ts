import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MailService } from 'src/mail/mail.service';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'xero',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, MailService]
})
export class InvoiceModule {}

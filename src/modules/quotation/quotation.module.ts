import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { QuotationAuthorizationService } from './quotation.authorization.service';
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
  controllers: [QuotationController],
  providers: [QuotationService, QuotationAuthorizationService, MailService]
})
export class QuotationModule {}

import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { MailService } from 'src/mail/mail.service';
import { LeadsAuthorizationService } from './leads.authorization.service';
import { SystemLogger } from '../system-logs/system-logger.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, MailService, LeadsAuthorizationService, SystemLogger]
})
export class LeadsModule {}

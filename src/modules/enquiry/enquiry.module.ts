import { Module } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { EnquiryController } from './enquiry.controller';
import { EnquiryAuthorizationService } from './enquiry.authorization.service';

@Module({
  controllers: [EnquiryController],
  providers: [EnquiryService, EnquiryAuthorizationService],
})
export class EnquiryModule {}

import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports:[

  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, AuthorizationService, 
    MailService, 
  ]
})
export class OrganizationModule {}

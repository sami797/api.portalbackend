import { Module } from '@nestjs/common';
import { ReimbursementService } from './reimbursement.service';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementAuthorizationService } from './reimbursement.authorization.service';

@Module({
  controllers: [ReimbursementController],
  providers: [ReimbursementService, ReimbursementAuthorizationService]
})
export class ReimbursementModule {}

import { Module } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestAuthorizationService } from './leave-request.authorization.service';

@Module({
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService, LeaveRequestAuthorizationService]
})
export class LeaveRequestModule {}

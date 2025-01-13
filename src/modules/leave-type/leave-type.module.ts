import { Module } from '@nestjs/common';
import { LeaveTypeService } from './leave-type.service';
import { LeaveTypeController } from './leave-type.controller';

@Module({
  controllers: [LeaveTypeController],
  providers: [LeaveTypeService]
})
export class LeaveTypeModule {}

import { Module } from '@nestjs/common';
import { LeaveCreditService } from './leave-credit.service';
import { LeaveCreditController } from './leave-credit.controller';

@Module({
  controllers: [LeaveCreditController],
  providers: [LeaveCreditService]
})
export class LeaveCreditModule {}

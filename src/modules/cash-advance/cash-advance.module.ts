import { Module } from '@nestjs/common';
import { CashAdvanceService } from './cash-advance.service';
import { CashAdvanceController } from './cash-advance.controller';
import { CashAdvanceAuthorizationService } from './cash-advance.authorization.service';

@Module({
  controllers: [CashAdvanceController],
  providers: [CashAdvanceService, CashAdvanceAuthorizationService]
})
export class CashAdvanceModule {}

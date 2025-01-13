import { Module } from '@nestjs/common';
import { PayrollCycleService } from './payroll-cycle.service';
import { PayrollCycleController } from './payroll-cycle.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { PayrollCycleCronJob } from './payroll-cycle.cronjob';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'payroll',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [PayrollCycleController],
  providers: [PayrollCycleService, PayrollCycleCronJob]
})
export class PayrollCycleModule {}

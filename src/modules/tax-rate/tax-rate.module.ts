import { Module } from '@nestjs/common';
import { TaxRateService } from './tax-rate.service';
import { TaxRateController } from './tax-rate.controller';

@Module({
  controllers: [TaxRateController],
  providers: [TaxRateService]
})
export class TaxRateModule {}

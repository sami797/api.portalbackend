import { Module } from '@nestjs/common';
import { XeroAccountingService } from './xero-accounting.service';
import { XeroAccountingController } from './xero-accounting.controller';
import { RedisService } from '../redis/redis.service';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { XeroProcessor } from './process/xero-accounting.processor';
import { XeroProcessorService } from './process/xero-accounting.processor.service';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'xero',
      configKey: REDIS_DB_NAME,
    }),
  ],
  providers: [XeroAccountingService, RedisService, XeroProcessor, XeroProcessorService],
  controllers: [XeroAccountingController]
})
export class XeroAccountingModule {}

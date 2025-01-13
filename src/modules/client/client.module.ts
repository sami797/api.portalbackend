import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'xero',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [ClientController],
  providers: [ClientService]
})
export class ClientModule {}

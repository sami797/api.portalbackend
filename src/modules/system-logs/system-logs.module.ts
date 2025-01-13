import { Global, Module } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogger } from './system-logger.service';

@Global()
@Module({
  controllers: [SystemLogsController],
  providers: [SystemLogsService, SystemLogger],
  exports: [SystemLogger]
})
export class SystemLogsModule {}

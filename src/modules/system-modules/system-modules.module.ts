import { Module } from '@nestjs/common';
import { SystemModulesService } from './system-modules.service';
import { SystemModulesController } from './system-modules.controller';

@Module({
  controllers: [SystemModulesController],
  providers: [SystemModulesService]
})
export class SystemModulesModule {}

import { Module } from '@nestjs/common';
import { DashboardElementsService } from './dashboard-elements.service';
import { DashboardElementsController } from './dashboard-elements.controller';
import { DashboardAuthorizationService } from './dashboard-elements.authorization.service';

@Module({
  controllers: [DashboardElementsController],
  providers: [DashboardElementsService, DashboardAuthorizationService]
})
export class DashboardElementsModule {}

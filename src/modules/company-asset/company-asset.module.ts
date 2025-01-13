import { Module } from '@nestjs/common';
import { CompanyAssetService } from './company-asset.service';
import { CompanyAssetController } from './company-asset.controller';

@Module({
  controllers: [CompanyAssetController],
  providers: [CompanyAssetService]
})
export class CompanyAssetModule {}

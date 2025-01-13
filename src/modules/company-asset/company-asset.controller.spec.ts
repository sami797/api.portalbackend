import { Test, TestingModule } from '@nestjs/testing';
import { CompanyAssetController } from './company-asset.controller';
import { CompanyAssetService } from './company-asset.service';

describe('CompanyAssetController', () => {
  let controller: CompanyAssetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyAssetController],
      providers: [CompanyAssetService],
    }).compile();

    controller = module.get<CompanyAssetController>(CompanyAssetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

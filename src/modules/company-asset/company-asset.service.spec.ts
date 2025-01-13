import { Test, TestingModule } from '@nestjs/testing';
import { CompanyAssetService } from './company-asset.service';

describe('CompanyAssetService', () => {
  let service: CompanyAssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyAssetService],
    }).compile();

    service = module.get<CompanyAssetService>(CompanyAssetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

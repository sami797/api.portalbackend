import { Test, TestingModule } from '@nestjs/testing';
import { FaqsCategoryService } from './faqs-category.service';

describe('FaqsCategoryService', () => {
  let service: FaqsCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaqsCategoryService],
    }).compile();

    service = module.get<FaqsCategoryService>(FaqsCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

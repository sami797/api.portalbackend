import { Test, TestingModule } from '@nestjs/testing';
import { FaqsCategoryController } from './faqs-category.controller';
import { FaqsCategoryService } from './faqs-category.service';

describe('FaqsCategoryController', () => {
  let controller: FaqsCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqsCategoryController],
      providers: [FaqsCategoryService],
    }).compile();

    controller = module.get<FaqsCategoryController>(FaqsCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

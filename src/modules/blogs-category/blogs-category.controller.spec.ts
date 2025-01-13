import { Test, TestingModule } from '@nestjs/testing';
import { BlogsCategoryController } from './blogs-category.controller';
import { BlogsCategoryService } from './blogs-category.service';

describe('BlogsController', () => {
  let controller: BlogsCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogsCategoryController],
      providers: [BlogsCategoryService],
    }).compile();

    controller = module.get<BlogsCategoryController>(BlogsCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

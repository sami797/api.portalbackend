import { Test, TestingModule } from '@nestjs/testing';
import { BlogsCategoryService } from './blogs-category.service';

describe('BlogsService', () => {
  let service: BlogsCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogsCategoryService],
    }).compile();

    service = module.get<BlogsCategoryService>(BlogsCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchesService } from './saved-searches.service';

describe('SavedSearchesService', () => {
  let service: SavedSearchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedSearchesService],
    }).compile();

    service = module.get<SavedSearchesService>(SavedSearchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

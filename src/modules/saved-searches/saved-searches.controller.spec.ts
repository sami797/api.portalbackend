import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';

describe('SavedSearchesController', () => {
  let controller: SavedSearchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedSearchesController],
      providers: [SavedSearchesService],
    }).compile();

    controller = module.get<SavedSearchesController>(SavedSearchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

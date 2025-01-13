import { Test, TestingModule } from '@nestjs/testing';
import { FileConvertorController } from './file-convertor.controller';
import { FileConvertorService } from './file-convertor.service';

describe('FileConvertorController', () => {
  let controller: FileConvertorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileConvertorController],
      providers: [FileConvertorService],
    }).compile();

    controller = module.get<FileConvertorController>(FileConvertorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

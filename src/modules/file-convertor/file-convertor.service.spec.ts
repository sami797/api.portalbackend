import { Test, TestingModule } from '@nestjs/testing';
import { FileConvertorService } from './file-convertor.service';

describe('FileConvertorService', () => {
  let service: FileConvertorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileConvertorService],
    }).compile();

    service = module.get<FileConvertorService>(FileConvertorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

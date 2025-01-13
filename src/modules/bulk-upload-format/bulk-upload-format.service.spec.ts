import { Test, TestingModule } from '@nestjs/testing';
import { BulkUploadFormatService } from './bulk-upload-format.service';

describe('BulkUploadFormatService', () => {
  let service: BulkUploadFormatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BulkUploadFormatService],
    }).compile();

    service = module.get<BulkUploadFormatService>(BulkUploadFormatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

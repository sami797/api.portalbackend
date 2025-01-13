import { Test, TestingModule } from '@nestjs/testing';
import { BulkUploadFormatController } from './bulk-upload-format.controller';
import { BulkUploadFormatService } from './bulk-upload-format.service';

describe('BulkUploadFormatController', () => {
  let controller: BulkUploadFormatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkUploadFormatController],
      providers: [BulkUploadFormatService],
    }).compile();

    controller = module.get<BulkUploadFormatController>(BulkUploadFormatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

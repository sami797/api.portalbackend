import { Module } from '@nestjs/common';
import { BulkUploadFormatService } from './bulk-upload-format.service';
import { BulkUploadFormatController } from './bulk-upload-format.controller';

@Module({
  controllers: [BulkUploadFormatController],
  providers: [BulkUploadFormatService]
})
export class BulkUploadFormatModule {}

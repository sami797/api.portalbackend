import { Module } from '@nestjs/common';
import { BiometricsJobService } from './biometrics-job.service';
import { BiometricsJobController } from './biometrics-job.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';
import { PropertyBulkUploadProcessor } from './processor/biometrics-job.processor';
import { BulkUploadJobService } from './processor/bulk-upload-job.service';
import { FileConvertorService } from '../file-convertor/file-convertor.service';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'bulk-upload-biometrics',
      configKey: REDIS_DB_NAME,
    }),
    BullModule.registerQueue({
      name: 'attendance',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [BiometricsJobController],
  providers: [BiometricsJobService, PropertyBulkUploadProcessor, BulkUploadJobService, FileConvertorService]
})
export class BiometricsJobModule {}

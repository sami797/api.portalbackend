import { Module } from '@nestjs/common';
import { FileConvertorService } from './file-convertor.service';
import { FileConvertorController } from './file-convertor.controller';

@Module({
  controllers: [FileConvertorController],
  providers: [FileConvertorService]
})
export class FileConvertorModule {}

import { Controller } from '@nestjs/common';
import { FileConvertorService } from './file-convertor.service';

@Controller('file-convertor')
export class FileConvertorController {
  constructor(private readonly fileConvertorService: FileConvertorService) {}
}

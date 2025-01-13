import { PartialType } from '@nestjs/swagger';
import { CreateBulkUploadFormatDto } from './create-bulk-upload-format.dto';

export class UpdateBulkUploadFormatDto extends PartialType(CreateBulkUploadFormatDto) {}

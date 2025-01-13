import { ApiProperty } from "@nestjs/swagger";
import { Prisma, BulkUploadFormat as __BulkUploadFormat } from "@prisma/client";
export class BulkUploadFormat implements __BulkUploadFormat {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    format: Prisma.JsonValue;
    
    @ApiProperty()
    sample: Prisma.JsonValue | null;
    
    @ApiProperty()
    comment: string | null;
    
    @ApiProperty()
    addedDate: Date;
    
}

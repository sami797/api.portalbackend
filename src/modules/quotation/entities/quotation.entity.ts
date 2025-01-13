import { ApiProperty } from "@nestjs/swagger";
import { Quotation as __Quotation } from "@prisma/client";
export class Quotation implements Partial<__Quotation> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    leadId: number;
    
    @ApiProperty()
    scopeOfWork: string;
    
    @ApiProperty()
    file: string;
    
    @ApiProperty()
    type: number;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    sentDate: Date;
    
    @ApiProperty()
    modifiedDate: Date;
    
    @ApiProperty()
    addedById: number;
    
    @ApiProperty()
    modifiedById: number;
    
}

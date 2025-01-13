import { ApiProperty } from "@nestjs/swagger";
import { Permit as __Permit } from "@prisma/client";
export class Permit implements Partial<__Permit> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    clientId: number;
    
    @ApiProperty()
    projectId: number;
    
    @ApiProperty()
    authorityId: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    remarks: string;
    
    @ApiProperty()
    financeStatus: number;
    
    @ApiProperty()
    clientStatus: number;
    
    @ApiProperty()
    approvedDate: Date;
    
    @ApiProperty()
    expiryDate: Date;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    modifiedDate: Date;
    
    @ApiProperty()
    addedById: number;
    
    @ApiProperty()
    modifiedById: number;
    
}

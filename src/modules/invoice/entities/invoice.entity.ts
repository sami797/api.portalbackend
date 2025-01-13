import { ApiProperty } from "@nestjs/swagger";
import { Invoice as __Invoice } from "@prisma/client";
export class Invoice implements Partial<__Invoice> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    message: string;
    
    @ApiProperty()
    projectId: number;
    
    @ApiProperty()
    clientId: number;
    
    @ApiProperty()
    amount: number;
    
    @ApiProperty()
    vatAmount: number;
    
    @ApiProperty()
    total: number;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    file: string;
    
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

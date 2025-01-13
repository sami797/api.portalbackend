import { ApiProperty } from "@nestjs/swagger";
import { Reimbursement as __Reimbursement } from "@prisma/client";
export class Reimbursement implements Partial<__Reimbursement> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    claimedAmount: number;
    
    @ApiProperty()
    requestById: number;
    
    @ApiProperty()
    approvedAmount: number;
    
    @ApiProperty()
    purpose: string;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    addedDate: Date;
    
}

import { ApiProperty } from "@nestjs/swagger";
import { CashAdvanceRequest } from "@prisma/client";
export class CashAdvance implements Partial<CashAdvanceRequest> {

    @ApiProperty()
    id: number;
    
    @ApiProperty()
    requestById: number;
    
    @ApiProperty()
    requestAmount: number;
    
    @ApiProperty()
    purpose: string;
    
    @ApiProperty()
    approvedAmount: number;
    
    @ApiProperty()
    numberOfInstallments: number;
    
    @ApiProperty()
    installmentAmount: number;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    submittedDate: Date;
    
}

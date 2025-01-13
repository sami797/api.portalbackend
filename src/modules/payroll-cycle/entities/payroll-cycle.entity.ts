import { ApiProperty } from "@nestjs/swagger";
import { PayrollCycle as __PayrollCycle } from "@prisma/client";
export class PayrollCycle implements Partial<__PayrollCycle> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    fromDate: Date;
    
    @ApiProperty()
    toDate: Date;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    processed: boolean;
    
}

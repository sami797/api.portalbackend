import { ApiProperty } from "@nestjs/swagger";
import { Account as AccountModel } from "@prisma/client";
export class Account implements Partial<AccountModel> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    accountCode: string;
    
    @ApiProperty()
    xeroReference: string;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    xeroType: string;
    
    @ApiProperty()
    description: string;
    
    @ApiProperty()
    bankAccountNumber: string;
    
    @ApiProperty()
    showInExpenseClaims: boolean;
    
}

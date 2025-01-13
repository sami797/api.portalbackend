import { ApiProperty } from "@nestjs/swagger";
import { Client as __Client } from "@prisma/client";
export class Client implements Partial<__Client> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    uuid: string;
    
    @ApiProperty()
    name: string;
    
    @ApiProperty()
    type: number;
    
    @ApiProperty()
    designation: string;
    
    @ApiProperty()
    phone: string;
    
    @ApiProperty()
    phoneCode: string;
    
    @ApiProperty()
    whatsapp: string;
    
    @ApiProperty()
    email: string;
    
    @ApiProperty()
    address: string;
    
    @ApiProperty()
    companyId: number;
    
    @ApiProperty()
    isDeleted: boolean;
    
}

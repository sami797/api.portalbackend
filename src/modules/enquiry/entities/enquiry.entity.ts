import { ApiProperty } from "@nestjs/swagger";
import { Enquiry as __Enquiry } from "@prisma/client";
export class Enquiry implements Partial<__Enquiry>{
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    uuid: string;
    
    @ApiProperty()
    name: string;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    email: string;
    
    @ApiProperty()
    phone: string;
    
    @ApiProperty()
    phoneCode: string;
    
    @ApiProperty()
    message: string;
    
    @ApiProperty()
    source: string;
    
    @ApiProperty()
    userAgent: string;
    
    @ApiProperty()
    userIP: string;
    
    @ApiProperty()
    reference: string;
    
    @ApiProperty()
    isDeleted: boolean;
    
}

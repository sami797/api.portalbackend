import { ApiProperty } from "@nestjs/swagger";
import { Organization as PrismaOrganization } from "@prisma/client";
export class Organization implements Partial<PrismaOrganization> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    uuid: string;
    
    @ApiProperty()
    email: string | null;
    
    @ApiProperty()
    phone: string | null;
    
    @ApiProperty()
    phoneCode: string | null;
    
    @ApiProperty()
    address: string | null;
    
    @ApiProperty()
    locationMap: string | null;
    
    @ApiProperty()
    description: string | null;
    
    @ApiProperty()
    logo: string | null;

    @ApiProperty()
    countryId: number;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    deletedDate: Date | null;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    addedBy: number | null;
    
    @ApiProperty()
    modifiedBy: number | null;
    
    @ApiProperty()
    deletedBy: number | null;
    
}

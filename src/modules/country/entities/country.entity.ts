import { ApiProperty } from "@nestjs/swagger";
import { Country as PrismaCountry, Prisma } from "@prisma/client";
export class Country implements Partial<PrismaCountry>{
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    name: string;

    @ApiProperty()
    vat?: number;
    
    @ApiProperty()
    isoCode: string;
    
    @ApiProperty()
    shortName: string;
    
    @ApiProperty()
    displayName: string | null;
    
    @ApiProperty()
    phoneCode: string | null;
    
    @ApiProperty()
    flag: string | null;

    @ApiProperty()
    status: number;
    
    @ApiProperty()
    defaultCurrency: number | null;
    
    @ApiProperty()
    defaultLanguage: number | null;
    
    @ApiProperty()
    enabledLanguages: number[];
    
    @ApiProperty()
    defaultAreaUnit: number | null;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    addedBy: number | null;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    modifiedBy: number | null;
    
    @ApiProperty()
    deletedDate: Date | null;
    
    @ApiProperty()
    deletedBy: number | null;
    
}


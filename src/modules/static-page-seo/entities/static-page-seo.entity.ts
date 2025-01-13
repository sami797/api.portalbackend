import { ApiProperty } from "@nestjs/swagger";
import { StaticPageSEO as __StaticPageSEO } from "@prisma/client";
export class StaticPageSeo implements __StaticPageSEO {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    seoTitle: string;
    
    @ApiProperty()
    seoDescription: string;
    
    @ApiProperty()
    image: string | null;
    
    @ApiProperty()
    countryId: number | null;

    @ApiProperty()
    sitePageId: number;
    
    @ApiProperty()
    organizationId: number | null;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    modifiedById: number;
    
    @ApiProperty()
    isDefault: number;
    
}

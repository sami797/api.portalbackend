import { ApiProperty } from "@nestjs/swagger";
import { PagesContent } from "@prisma/client";
export class SitePagesContent implements Partial<PagesContent> {

    @ApiProperty()
    id: number;
    
    @ApiProperty()
    pageSectionId: number;
    
    @ApiProperty()
    image: string | null;
    
    @ApiProperty()
    imageAlt: string | null;
    
    @ApiProperty()
    isDefault: number;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    addedById: number | null;
    
    @ApiProperty()
    countryId: number | null;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    modifiedById: number | null;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    isDeleted: boolean;
    

}

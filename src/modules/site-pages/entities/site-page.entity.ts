import { ApiProperty } from "@nestjs/swagger";
import { SitePages } from "@prisma/client";
export class SitePage implements Partial<SitePages> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    description: string | null;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    isDeleted: boolean;
    
}

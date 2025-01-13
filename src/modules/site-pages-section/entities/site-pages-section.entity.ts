import { ApiProperty } from "@nestjs/swagger";
import { PagesSection } from "@prisma/client";
export class SitePagesSection implements Partial<PagesSection> {
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

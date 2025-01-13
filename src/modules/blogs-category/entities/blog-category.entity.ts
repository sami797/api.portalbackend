import { ApiProperty } from "@nestjs/swagger";
import { BlogsCategory as PrismaBlogsCategory } from "@prisma/client";
export class BlogCategory  implements Partial<PrismaBlogsCategory> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    category: number;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    image: string | null;
    
    @ApiProperty()
    imageAlt: string | null;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    countryId: number | null;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    deletedDate: Date | null;
    
    @ApiProperty()
    addedById: number | null;
    
    @ApiProperty()
    modifiedById: number | null;
    
    @ApiProperty()
    deletedById: number | null;
    
}

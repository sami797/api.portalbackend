import { ApiProperty } from "@nestjs/swagger";
import { Blogs as PrismaBlogs } from "@prisma/client";
export class Blog  implements Partial<PrismaBlogs> {
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

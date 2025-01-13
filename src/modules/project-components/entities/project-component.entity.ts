import { ApiProperty } from "@nestjs/swagger";
import { ProjectComponent as __ProjectComponent } from "@prisma/client";
export class ProjectComponent implements Partial<__ProjectComponent> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    addedDate: Date;
    
}

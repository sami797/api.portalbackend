import { ApiProperty } from "@nestjs/swagger";
import { Department as __Department } from "@prisma/client";
export class Department implements Partial<__Department> {
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

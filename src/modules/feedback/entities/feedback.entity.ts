import { ApiProperty } from "@nestjs/swagger";
import { Feedback as __Feedback } from "@prisma/client";
export class Feedback implements Partial<__Feedback> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    type: number;
    
    @ApiProperty()
    url: string;
    
    @ApiProperty()
    rating: number;
    
    @ApiProperty()
    comment: string;
    
    @ApiProperty()
    addedById: number;
    
    @ApiProperty()
    addedDate: Date;
    
}

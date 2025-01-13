import { ApiProperty } from "@nestjs/swagger";
import { ThresholdType, LeaveType as __LeaveType } from "@prisma/client";
export class LeaveType implements Partial<__LeaveType> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    isPaid: boolean;
    
    @ApiProperty()
    threshold: number;
    
    @ApiProperty()
    frequency: ThresholdType;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    isPublished: boolean;
}

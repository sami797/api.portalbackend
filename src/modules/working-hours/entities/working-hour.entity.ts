import { ApiProperty } from "@nestjs/swagger";
import { Prisma, WorkingHours } from "@prisma/client";
export class WorkingHour implements WorkingHours {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    hours: Prisma.JsonValue;
    
    @ApiProperty()
    addedDate: Date;
    
}

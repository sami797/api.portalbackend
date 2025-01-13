import { ApiProperty } from "@nestjs/swagger";
import { Task as __Task } from "@prisma/client";
export class Task implements Partial<__Task> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    uuid: string;
    
    @ApiProperty()
    projectId: number | null;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    priority: number;
    
    @ApiProperty()
    instructions: string | null;
    
    @ApiProperty()
    taskStartFrom: Date | null;
    
    @ApiProperty()
    taskEndOn: Date | null;
    
    @ApiProperty()
    hasExtendedDate: boolean;
    
    @ApiProperty()
    extendedDate: Date | null;
    
    @ApiProperty()
    reasonOfExtension: string | null;
    
    @ApiProperty()
    addedById: number | null;
    
    @ApiProperty()
    closedById: number | null;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    isDeleted: boolean;
    
}

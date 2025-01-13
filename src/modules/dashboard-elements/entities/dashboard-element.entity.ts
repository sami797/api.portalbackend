import { ApiProperty } from "@nestjs/swagger";
import { DashboardElement as __DashboardELement } from "@prisma/client";
export class DashboardElement implements Partial<__DashboardELement> {
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
    
}

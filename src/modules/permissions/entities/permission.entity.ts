import { ApiProperty } from "@nestjs/swagger";
import { ModulesVisibility, Permissions as PrismaPermission, Prisma } from "@prisma/client";
export class Permission  implements Partial<PrismaPermission> { 
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    name: string | null;
    
    @ApiProperty()
    action: string;
    
    @ApiProperty()
    moduleId: number;

    @ApiProperty()
    visibility?: ModulesVisibility;
    
    @ApiProperty()
    condition: Prisma.JsonValue | null;
    
    @ApiProperty()
    url: string | null;
    
    @ApiProperty()
    description: string | null;

    @ApiProperty()
    icon: string;

    @ApiProperty()
    order: number;

    @ApiProperty()
    isMenuItem: boolean;
    
}

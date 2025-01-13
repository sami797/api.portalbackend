import { ApiProperty } from "@nestjs/swagger";
import { BiometricsJob as __BiometricsJob } from "@prisma/client";
export class BiometricsJob implements Partial<__BiometricsJob> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    file: string;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    addedById: number;
    
    @ApiProperty()
    addedDate: Date;
    
}

import { ApiProperty } from "@nestjs/swagger";
import { CarReservationRequest as __CarReservation}from "@prisma/client";
export class CarReservation implements Partial<__CarReservation> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    date: Date;
    
    @ApiProperty()
    requestById: number;
    
    @ApiProperty()
    projectId: number;
    
    @ApiProperty()
    companyCarId: number;
    
    @ApiProperty()
    prupose: string;
    
    @ApiProperty()
    status: number;
    
    @ApiProperty()
    addedDate: Date;
    
}

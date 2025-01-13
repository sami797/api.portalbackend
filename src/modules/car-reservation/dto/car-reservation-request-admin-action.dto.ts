import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { CarReservationRequestStatus } from "src/config/constants";


export class CarReservationRequestAdminAction {

    @ValidateIf((o:CarReservationRequestAdminAction) => o.status === CarReservationRequestStatus.approved )
    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid data"})
    @Type(() => Number)
    companyCarId?: number;
    
    @ApiPropertyOptional()
    @IsOptional()
    comment?: string

    @ApiProperty({enum: [CarReservationRequestStatus.approved,CarReservationRequestStatus.rejected]})
    @IsNotEmpty({message: "Please choose receipt action, whether it is approved or rejected"})
    @IsIn([CarReservationRequestStatus.approved,CarReservationRequestStatus.rejected], {message: "Please choose whether to approve or reject this request"})
    @Type(() => Number)
    status: CarReservationRequestStatus.approved | CarReservationRequestStatus.rejected
}
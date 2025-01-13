import { ApiProperty } from "@nestjs/swagger";
import { UserAlertsSetting as __UserAlertsSetting } from "@prisma/client";
export class UserAlertsSetting implements Partial<__UserAlertsSetting> {

    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number | null;

    @ApiProperty()
    alertsTypeId: number | null;

    @ApiProperty()
    desktop: boolean;

    @ApiProperty()
    mobile: boolean;

    @ApiProperty()
    email: boolean;

    @ApiProperty()
    app: boolean;

    @ApiProperty()
    addedDate: Date;

    @ApiProperty()
    modifiedDate: Date | null;

}

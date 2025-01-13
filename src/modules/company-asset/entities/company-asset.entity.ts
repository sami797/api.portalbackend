import { ApiProperty } from "@nestjs/swagger";
import { CompanyAsset as __CompanyAsset } from "@prisma/client";
export class CompanyAsset implements Partial<__CompanyAsset>{
    @ApiProperty()
    id: number;

    @ApiProperty()
    code: string;

    @ApiProperty()
    type: number;

    @ApiProperty()
    assetName: string;

    @ApiProperty()
    assetDetail: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty()
    addedDate: Date;
}

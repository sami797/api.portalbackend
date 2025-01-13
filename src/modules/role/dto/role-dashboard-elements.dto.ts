import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty} from 'class-validator';
import { ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class RoleDashboardElements {

    @ApiProperty({type: "array"})
    @IsNotEmpty({message: "Please provide the role id(s)"})
    @ParseCustomNumberArray()
    elementIds: number | Array<number>;

}

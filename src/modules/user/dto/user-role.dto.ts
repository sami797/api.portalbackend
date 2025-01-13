import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty} from 'class-validator';
import { ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class UserRoleDto {

    @ApiProperty({type: "array"})
    @IsNotEmpty({message: "Please provide the role id(s)"})
    @ParseCustomNumberArray()
    roleIds: number | Array<number>;

}

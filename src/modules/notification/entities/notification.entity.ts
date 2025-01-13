import { ApiProperty } from "@nestjs/swagger";
import {Notification as __Notification, NotificationType} from "@prisma/client"
export class Notification implements Partial<__Notification> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    slug: string | null;
    
    @ApiProperty()
    icon: string | null;
    
    @ApiProperty()
    message: string | null;
    
    @ApiProperty()
    link: string | null;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    type: NotificationType;
    
    @ApiProperty()
    isActive: boolean;
    
}

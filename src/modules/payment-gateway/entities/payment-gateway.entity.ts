import { ApiProperty } from "@nestjs/swagger";
import { PaymentGateway as PrismaPaymentGateway } from "@prisma/client";

export class PaymentGateway implements Partial<PrismaPaymentGateway> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    gatewayURL: string | null;
    
    @ApiProperty()
    gatewayPublicKey: string | null;
    
    @ApiProperty()
    gatewayPrivateKey: string;
    
    @ApiProperty()
    isPublished: boolean;
    
    @ApiProperty()
    isDeleted: boolean;
    
    @ApiProperty()
    addedDate: Date;
    
    @ApiProperty()
    addedById: number | null;
    
    @ApiProperty()
    modifiedDate: Date | null;
    
    @ApiProperty()
    modifiedById: number | null;
    
    @ApiProperty()
    deletedDate: Date | null;
    
    @ApiProperty()
    deletedById: number | null;
    
}

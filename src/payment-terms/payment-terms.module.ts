import { Module } from '@nestjs/common';
import { PaymentTermsController } from './payment-terms.controller';
import { PaymentTermsService } from './payment-terms.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PaymentTermsController],
  providers: [PaymentTermsService, PrismaService],
})
export class PaymentTermsModule {}

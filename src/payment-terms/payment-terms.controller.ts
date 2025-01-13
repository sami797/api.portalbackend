import { Controller, Get, Patch, Param, Body, BadRequestException, NotFoundException, Query } from '@nestjs/common';
import { PaymentTermsService } from './payment-terms.service';
import { PaymentTermsStatus, PaymentTerm } from '@prisma/client';

@Controller('payment-terms')
export class PaymentTermsController {
  constructor(private readonly paymentTermsService: PaymentTermsService) {}

  @Get(':id')
  async getPaymentTerm(@Param('id') id: string): Promise<PaymentTerm | null> {
    console.log('Received ID:', id); // Log ID for debugging
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID');
    }
    return this.paymentTermsService.getPaymentTerm(numericId);
  }
  @Get('statuses')
  async getPaymentTermsStatuses(
    @Query('ids') ids: string[]
  ): Promise<Map<number, PaymentTermsStatus>> {
    // Log the received IDs for debugging
    console.log('Received IDs:', ids);

    if (!ids || !Array.isArray(ids)) {
      throw new BadRequestException('Invalid IDs');
    }

    // Convert ids to numbers
    const numericIds = ids.map(id => {
      const numId = Number(id);
      if (isNaN(numId)) {
        throw new BadRequestException('Invalid ID');
      }
      return numId;
    });

    return this.paymentTermsService.getStatusesByIds(numericIds);
  }



  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ): Promise<PaymentTerm> {
    console.log('Received ID:', id); // Log ID for debugging
    console.log('Received Status:', status); // Log status for debugging
  
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID');
    }
  
    const paymentTermsStatus = PaymentTermsStatus[status as keyof typeof PaymentTermsStatus];
    if (!paymentTermsStatus) {
      throw new BadRequestException('Invalid status');
    }
  
    const updatedTerm = await this.paymentTermsService.updatePaymentTermStatus(numericId, paymentTermsStatus);
    if (!updatedTerm) {
      throw new NotFoundException('Payment Term not found');
    }
  
    return updatedTerm;
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentTermsStatus, PaymentTerm } from '@prisma/client';
import { Item } from 'xero-node';

@Injectable()
export class PaymentTermsService {
  constructor(private readonly prisma: PrismaService) {}

  // Get a single payment term by ID
  async getPaymentTerm(termId: number): Promise<PaymentTerm | null> {
    const term = await this.prisma.paymentTerm.findUnique({ where: { id: termId } });
    if (!term) {
      throw new NotFoundException('Payment Term not found');
    }
    return term;
  }

  // Update the status of a single payment term
  async updatePaymentTermStatus(termId: number, newStatus: PaymentTermsStatus): Promise<PaymentTerm> {
    // Check if the term exists
    const term = await this.prisma.paymentTerm.findUnique({ where: { id: termId } });
    if (!term) {
      throw new NotFoundException('Payment Term not found');
    }

    // Update the term status
    const updatedTerm = await this.prisma.paymentTerm.update({
      where: { id: termId },
      data: { status: newStatus },
    });

    // Optionally update additional terms if needed
    if (newStatus === PaymentTermsStatus.Completed) {
      // Find the next term
      const nextTerm = await this.prisma.paymentTerm.findFirst({
        where: { id: { gt: termId } },
        orderBy: { id: 'asc' },
      });

      if (nextTerm) {
        // Update the status of the next term
        await this.prisma.paymentTerm.update({
          where: { id: nextTerm.id },
          data: { status: PaymentTermsStatus.InProgress },
        });
      }
    }

    // Return the updated term
    return updatedTerm;
  }

  // Fetch statuses for multiple IDs
  async getStatusesByIds(termIds: number[]): Promise<Map<number, PaymentTermsStatus>> {
    const terms = await this.prisma.paymentTerm.findMany({
      where: {
        id: { in: termIds }
      },
      select: {
        id: true,
        status: true
      }
    });



    const statuses: Map<number, PaymentTermsStatus> = new Map();
    terms.forEach(term => {
      statuses.set(term.id, term.status);
    });

    return statuses;
  }

}  

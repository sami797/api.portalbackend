
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class PayrollCycleCronJob {
    private readonly logger = new Logger(PayrollCycleCronJob.name);
    constructor(@InjectQueue('payroll') private payrollQueue: Queue, private readonly prisma: PrismaService ) {}

    // @Cron('0 2 * * *')
    async preparePayrollReport() {
        this.logger.log("Called every day at 02:00AM to check if paydate has come");
        let today = new Date();
        today.setHours(0,0,0,0);
        let payrollCycle = await this.prisma.payrollCycle.findFirst({
            where:{
                processed: false,
                processing: false,
                toDate: {
                    lte: today
                }
            },
            orderBy:{
                fromDate: 'asc'
              }
        })

        if(payrollCycle){

            let lastPayrollCycle = await this.prisma.payrollCycle.findFirst({
                where: {
                  processed: false,
                  processing: false,
                },
                orderBy:{
                  toDate: 'desc'
                }
              })

            let nextCycleStartDate = new Date(lastPayrollCycle.toDate);
            nextCycleStartDate.setHours(0,0,0,0);
            nextCycleStartDate.setDate(nextCycleStartDate.getDate() + 1);

            let nextCycleEndDate = new Date(lastPayrollCycle.toDate);
            nextCycleEndDate.setHours(23, 59, 59, 999);
            nextCycleEndDate.setDate(nextCycleEndDate.getDate() + 30);

            let doesExist = await this.prisma.payrollCycle.findFirst({
                where:{
                    fromDate: nextCycleStartDate,
                    toDate: nextCycleEndDate,
                }
            })

            if(!doesExist){
                await this.prisma.payrollCycle.create({
                    data: {
                        fromDate: nextCycleStartDate,
                        toDate: nextCycleEndDate,
                        processed: false
                    }
                })
            }

            await this.prisma.payrollCycle.update({
                where: {
                    id: payrollCycle.id
                },
                data:{
                    processing: true
                }
            })

        this.payrollQueue.add('preparePayrollReport',{
            message: "Start Preparing Payroll Report",
            data: payrollCycle
          },{removeOnComplete: true})
        }else{
            this.logger.log("No payroll found to process");
        }
    }
}
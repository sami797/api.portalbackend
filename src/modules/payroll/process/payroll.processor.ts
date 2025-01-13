import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PayrollProcessorService } from './payroll.processor.service';
import { PayrollCycle } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Processor('payroll')
export class PayrollProcessor {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly payrollProcessorService: PayrollProcessorService, private readonly prisma: PrismaService){}

  @Process('preparePayrollReport')
  async preparePayrollReport(job: Job<{data: PayrollCycle}>) {
    let payrollCycle = job.data?.data;
    try{
        if(!payrollCycle){
            throw {message: "No Payroll cycle provided"}
        }
        await this.payrollProcessorService.preparePayrollReportofAllUser(payrollCycle);
    }catch(err){
        this.logger.error(`Payroll Report Process Error ${payrollCycle?.id}`, err.message)
        await this.prisma.payrollCycle.update({
          where:{
            id: payrollCycle?.id,
            processing: true
          },
          data:{
            processing: false,
            failedReport: [err.message]
          }
        })
    }
  }

  @Process('preparePayrollReportOfUser')
  async preparePayrollReportOfUser(job: Job<{data: {PayrollCycle: PayrollCycle, userId: number, salary: number, salaryId: number, payrollId?: number}}>) {
    try{
        let payrollCycle = job.data.data.PayrollCycle;
        let userId = job.data.data.userId;
        let salary = job.data.data.salary;
        let salaryId = job.data.data.salaryId;
        let payrollId = job.data.data.payrollId;
        if(!payrollCycle){
            throw {message: "No Payroll cycle provided"}
        }
        if(!userId){
            throw {message: "No UserID provided"}
        }
        if(!salary){
          throw {message: "No Salary Found"}
      }
        let userData = await this.prisma.user.findFirst({
          where:{
            id: userId
          },
          select:{
            Organization:{
              select:{
                WorkingHours: true
              }
            }
          }
        })

        if(!userData?.Organization?.WorkingHours){
          throw {
            message: "No Working Hours Assigned to the Company, Can't process",
            statusCode: 400
          }
        }

        return await this.payrollProcessorService.preparePayrollReportOfUser(payrollCycle, userId, salary, salaryId, userData?.Organization?.WorkingHours, payrollId);
    }catch(err){
        console.error("Payroll Report Process Error", err?.message)
    }
  }

  @Process()
  globalHandler(job: Job) {
    this.logger.error('No listners were provided, fall back to default', job.data);
  }
}

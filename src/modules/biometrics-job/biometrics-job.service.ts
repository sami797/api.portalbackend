import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { BiometricsJobFilters } from './dto/biometrics-job-filters.dto';
import { CreateBiometricsJobDto } from './dto/create-biometrics-job.dto';
import { UpdateBiometricsJobDto } from './dto/update-biometrics-job.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { BiometricsJobStatus } from 'src/config/constants';
import { BiometricsJobRollbackDto } from './dto/biometrics-job-rollback.dto';
import { getDifferenceInDays, getEnumKeyByEnumValue } from 'src/helpers/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BiometricsJobService {

  private readonly logger = new Logger(BiometricsJobService.name);
  constructor(private prisma: PrismaService,
    @InjectQueue('bulk-upload-biometrics') private propertyQueue: Queue, 
    ) {
  }

  create(createDto: CreateBiometricsJobDto) {

    return this.prisma.biometricsJob.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.BiometricsJobWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.biometricsJob.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        _count:{
          select:{
            BiometricsChecks: true
          }
        },
        AddedBy:{
          select: UserDefaultAttributes
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.biometricsJob.findUnique({
      where: {
        id: id,
        isDeleted: false
      },
      include:{
        _count:{
          select:{
            BiometricsChecks: true
          }
        },
        AddedBy:{
          select: UserDefaultAttributes
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateBiometricsJobDto) {

    return this.prisma.biometricsJob.update({
      data: updateDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  applyFilters(filters: BiometricsJobFilters) {
    let condition: Prisma.BiometricsJobWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {


      if (filters.status) {
        condition = { ...condition, status: filters.status }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              addedDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              addedDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.BiometricsJobWhereInput) {
    return this.prisma.biometricsJob.count({
      where: filters
    })
  }

  async remove(jobId: number){
    let recordData = await this.prisma.biometricsJob.findFirst({
      where:{
        id: jobId
      }
    })

    if(!(recordData.status === BiometricsJobStatus.new || recordData.status === BiometricsJobStatus.rollback)){
      throw {
        message: "You can only delete the record if it is not processed",
        statusCode: 400
      }
    }

    return this.prisma.biometricsJob.update({
      where:{
        id: jobId
      },
      data:{
        isDeleted: true
      }
    })
  }

  async rollback(jobId: number, biometricsJobRollbackDto: BiometricsJobRollbackDto){
    let recordData = await this.prisma.biometricsJob.findFirst({
      where:{
        id: jobId
      }
    })

    if(!(recordData.status === BiometricsJobStatus.completed || recordData.status === BiometricsJobStatus.failed)){
      throw {
        message: `You can only rollback the record once the job has compled or failed. This job is currently in state:${getEnumKeyByEnumValue(BiometricsJobStatus, recordData.status)}`,
        statusCode: 400
      }
    }

    let differenceInDays = Math.abs(getDifferenceInDays(recordData.addedDate, new Date()))
    if(differenceInDays > 3){
      throw {
        message: "You can only rollback last 3 days record",
        statusCode: 400
      }
    }

    await this.prisma.biometricsChecks.deleteMany({
      where:{
        biometricsJobId: recordData.id
      }
    })

    let updatedRecord = await this.prisma.biometricsJob.update({
      where:{
        id: recordData.id
      },
      data:{
        status: BiometricsJobStatus.rollback
      },
      include:{
        _count:{
          select:{
            BiometricsChecks: true
          }
        },
        AddedBy:{
          select: UserDefaultAttributes
        }
      },
    })
    return updatedRecord

  }

  setIsProcessing(id: number){
    return this.prisma.biometricsJob.update({
      where:{
        id: id
      },
      data:{
        status: BiometricsJobStatus.processing
      }
    })
  }

  async bulkUploadBiometrics(jobId: number) {
    let job = await this.prisma.biometricsJob.findUnique({
      where: {
        id: jobId
      },
      include: {
        UploadFormat: true
      }
    })

    if (!job || !job.UploadFormat || !job.UploadFormat.format) {
      throw {
        message: "Cannot find a job or a data format",
        statusCode: 400
      }
    }
    if (job.status === BiometricsJobStatus.completed) {
      throw {
        message: "This file has already been processed",
        statusCode: 200
      }
    }
    if (job.status === BiometricsJobStatus.processing) {
      throw {
        message: "This file is currently under progress, please check back later",
        statusCode: 200
      }
    }

    let jobData = await this.propertyQueue.add('bulkUploadBiometrics',{
      message: "Start Bulk Upload Biometrics",
      data: {
        jobId: jobId
      }
    },{removeOnComplete: true})

    return this.prisma.biometricsJob.update({
      where:{
        id: jobId
      },
      data:{
        status: BiometricsJobStatus.processing,
        backgroundId: jobData.id.toString(),
        processeStartDate: new Date()
      }
    })

  }

  async stopUploadBiometrics(jobId: number){
    let data = await this.prisma.biometricsJob.findFirst({
      where:{
        id: jobId
      }
    })

    if(!data){
      throw{
        message: "Requested job not found",
        statusCode: 404
      }
    }

    if(data.status === BiometricsJobStatus.processing){
      let jobData = await this.propertyQueue.add('stopBulkUploadBiometrics',{
        message: "Stop Bulk Biometrics Upload",
        data: {
          jobId: jobId
        }
      },{removeOnComplete: true})
      return {message: "Stopping"}
    }else{
      throw{
        message: "Requested Job was never started. Job must be in a runnung state to stop.",
        statusCode: 400
      }
    }
  }

}



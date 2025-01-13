import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { getDifferenceInDays, getEnumKeyByValue, sleep, slugify } from 'src/helpers/common';
import { readS3JsonFile, uploadFromUrl } from 'src/helpers/file-management';
import { PrismaService } from 'src/prisma.service';
import { DataFormatTree } from 'src/modules/bulk-upload-format/dto/create-bulk-upload-format.dto';
import { BiometricsEntryType, BiometricsJobStatus } from 'src/config/constants';
import * as moment from 'moment';
import { FileConvertorService } from 'src/modules/file-convertor/file-convertor.service';
import { getDynamicUploadPath } from '../dto/biometrics-jobs.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BulkUploadJobService {

  private readonly logger = new Logger(BulkUploadJobService.name);
  totalRecords = 0;
  failedRecords = 0;
  success = 0;
  myCounter = 1;
  errorReport: Array<any> = []
  errorRecords: Array<any> = []
  activeJob: number = null;
  jobQueue: Array<number> = [];
  isProcessing = false;

  constructor(private prisma: PrismaService, @InjectQueue('attendance') private attendanceQueue: Queue, private readonly fileConvertorService: FileConvertorService) {

  }

  resetData() {
    this.totalRecords = 0;
    this.failedRecords = 0;
    this.success = 0;
    this.myCounter = 1;
    this.errorReport = []
    this.errorRecords = []
  }

  findOne(id: number) {
    return this.prisma.biometricsJob.findUnique({
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  async bulkUploadProperty(jobId: number) {
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
        message: "This file has been processed already",
        statusCode: 200
      }
    }

    let uploadPath = getDynamicUploadPath() + "/converted/";
    let jsonFile = job.processedFile;
    if (!jsonFile) {
      jsonFile = await this.fileConvertorService.convertFileToJSON(job.file, uploadPath);
      await sleep(3000);
      await this.prisma.biometricsJob.update({
        where: {
          id: job.id
        },
        data: {
          processedFile: jsonFile
        }
      })
    }
    let today = new Date();
    let uploadFormat: DataFormatTree = job.UploadFormat.format as DataFormatTree;
    const allData: any = await readS3JsonFile(jsonFile);
    let data: Array<any> = []
    try {
      data = uploadFormat.entry.position.reduce((a, prop) => a[prop], allData);
    } catch (err) {
      throw {
        message: "Doesnot look like the entry point is matching to the format provided. Please make sure you are using the correct format",
        statusCode: 400
      }
    }
    if (Array.isArray(data)) {
      await this.prisma.biometricsJob.update({
        where: {
          id: job.id
        },
        data: {
          status: BiometricsJobStatus.processing,
          totalRecords: data.length,
        }
      })
    } else {
      throw {
        message: "Doesnot look like the entry point is matching to the format provided. Please make sure you are using the correct format",
        statusCode: 400
      }
    }
    this.totalRecords = data.length;
    console.log(`Processing ${data.length} rows`);


    try {
      let employeeId1 = uploadFormat.employeeNumber.position.reduce((a, prop) => a[prop], data[0]);
      let employeeId2 = uploadFormat.employeeNumber.position.reduce((a, prop) => a[prop], data[1]);
      if(!employeeId1 && !employeeId2){
        throw {
          message: "Upload format doesnot match with data provided"
        }
      }
    } catch (err) {
      this.logger.error("Doesnot look like data format is correct, stopping job...", err.message);
      this.errorReport.push({
        message: err.message
      })
      this.failedRecords = data.length;
      if (this.totalRecords > 0 && (this.success > 0 || this.failedRecords > 0)) {
        let jobUpdateData: Prisma.BiometricsJobUpdateInput = {
          totalRecords: this.totalRecords,
          success: this.success,
          failed: this.failedRecords,
          failedRecord: this.errorRecords,
          failedReport: this.errorReport,
          status: BiometricsJobStatus.failed
        }
        this.logBulkPropertyUpload(job.id, jobUpdateData)
      }
      return
    }

    let myInterval = setInterval(async () => {
      if (data.length <= 0) {
        if (this.totalRecords > 0 && (this.success > 0 || this.failedRecords > 0)) {
          let jobUpdateData: Prisma.BiometricsJobUpdateInput = {
            totalRecords: this.totalRecords,
            success: this.success,
            failed: this.failedRecords,
            failedRecord: this.errorRecords,
            failedReport: this.errorReport,
            status: BiometricsJobStatus.completed
          }
          this.logBulkPropertyUpload(job.id, jobUpdateData)
        }
        clearInterval(myInterval);
        return
      }
      console.log("Processing item", this.myCounter++);

      let uploadData = data.shift();
      if (!uploadData) {
        if (this.totalRecords > 0 && (this.success > 0 || this.failedRecords > 0)) {
          let jobUpdateData: Prisma.BiometricsJobUpdateInput = {
            totalRecords: this.totalRecords,
            success: this.success,
            failed: this.failedRecords,
            failedRecord: this.errorRecords,
            failedReport: this.errorReport,
            status: BiometricsJobStatus.completed
          }
          this.logBulkPropertyUpload(job.id, jobUpdateData)
        }
        clearInterval(myInterval);
        return
      };

      if (jobId !== this.activeJob) {
        let jobUpdateData: Prisma.BiometricsJobUpdateInput = {
          totalRecords: this.totalRecords,
          success: this.success,
          failed: this.failedRecords,
          failedRecord: this.errorRecords,
          failedReport: [...this.errorReport, {
            message: "Manual request to stop the job",
            dataProcessed: this.myCounter,
            stoppedAt: (new Date()).toLocaleString("en-US", { timeZone: 'Asia/Dubai' })
          }],
          status: BiometricsJobStatus.force_stopped
        }
        this.logBulkPropertyUpload(job.id, jobUpdateData)
        clearInterval(myInterval);
        return
      }

      let reference;
      try {

        let employeeId: number, employeeName: string, date: string, time: string;
        try {
          employeeId = uploadFormat.employeeNumber.position.reduce((a, prop) => a[prop], uploadData);
          employeeId = Number(employeeId);
          reference = employeeId;
        } catch (err) {
          this.logger.error("Employee ID Error", err.message)
        }

        if(!employeeId){
          throw {
            message: "No User Id Provided",
            reference: reference
          }
        }

        let userData = await this.prisma.user.findFirst({
          where: {
            id: employeeId
          }
        })

        if (!userData) {
          throw {
            message: "No User Found with ID:" + employeeId,
            reference: reference
          }
        }

        try {
          date = uploadFormat.date.position.reduce((a, prop) => a[prop], uploadData);
        } catch (err) {
          this.logger.error("Checkin Date Error", err.message)
        }

        if (!date) {
          throw {
            message: "No Date Found, Employee ID:" + employeeId,
            reference: reference
          }
        }

        try {
          time = uploadFormat.time.position.reduce((a, prop) => a[prop], uploadData);
        } catch (err) {
          this.logger.error("Checkin Time Error", err.message)
        }

        if (!time) {
          throw {
            message: "No Time Found, Employee ID:" + employeeId,
            reference: reference
          }
        }

        let allInsertData: Array<Prisma.BiometricsChecksUncheckedCreateInput> = []
        if (uploadFormat.time.valueType === 'space-separated') {
          let allCheckins = time.split(" ");
          allCheckins.forEach((ele) => {
            let checkInDateTime = this.initializeDateAndTime(date, ele);
            if (!checkInDateTime) {
              this.failedRecords++;
              this.errorReport.push({
                message: "Date time parsing failed",
                reference: "Date" + date + " Employee Id: " + employeeId
              })
              this.errorRecords.push(uploadData);
              console.log("Date time parsing failed. Employee Id:" + employeeId + " Date:" + date + " Time:" + time);
            } else {

              let daysDifference = Math.abs(getDifferenceInDays(today, checkInDateTime));
              //TODO change daysDifference to 31 days
              if (daysDifference > 60 || checkInDateTime > today) {
                this.failedRecords++;
                this.errorReport.push({
                  message: "Old Date or Future Date Found. System doesnot allow to add record older than 31 days or Future Dates",
                  reference: "Date" + date + " Employee Id: " + employeeId
                })
                this.errorRecords.push(uploadData);
                console.log("Old Date Found or Future Date Found. System doesnot allow to add record older than 31 days or Future Dates. Employee Id:" + employeeId + "Date:" + date + " Time:" + time);
              } else {
                let insertData: Prisma.BiometricsChecksUncheckedCreateInput = {
                  userId: Number(employeeId),
                  checkIn: checkInDateTime,
                  mode: 'in',
                  type: BiometricsEntryType.auto,
                  biometricsJobId: job.id,
                  addedDate: new Date()
                }
                allInsertData.push(insertData);
              }
            }
          })
        } else {
          let checkInDateTime = this.initializeDateAndTime(date, time);
          if (!checkInDateTime) {
            this.failedRecords++;
            this.errorReport.push({
              message: "Date time parsing failed",
              reference: "Date" + date + " Employee Id: " + employeeId
            })
            this.errorRecords.push(uploadData);
            console.log("Date time parsing failed. Employee Id:" + employeeId + " Date:" + date + " Time:" + time);
          } else {
            let daysDifference = Math.abs(getDifferenceInDays(today, checkInDateTime));
            if (daysDifference > 31 || checkInDateTime > today) {
              this.failedRecords++;
              this.errorReport.push({
                message: "Old Date Found or Future Date Found. System doesnot allow to add record older than 31 days  or Future Dates",
                reference: "Date" + date + " Employee Id: " + employeeId
              })
              this.errorRecords.push(uploadData);
              console.log("Old Date Found or Future Date Found. System doesnot allow to add record older than 31 days  or Future Dates. Employee Id:" + employeeId + "Date:" + date + " Time:" + time);
            } else {
              let insertData: Prisma.BiometricsChecksUncheckedCreateInput = {
                userId: Number(employeeId),
                checkIn: checkInDateTime,
                mode: 'in',
                type: BiometricsEntryType.bulk,
                biometricsJobId: job.id,
                addedDate: new Date()
              }
              allInsertData.push(insertData);
            }
          }
        }

        if (allInsertData.length > 0) {
          let allRecordsCreated = [];
          allInsertData.forEach((ele) => {
            let r = this.prisma.biometricsChecks.upsert({
              where: {
                userId_checkIn: {
                  userId: ele.userId,
                  checkIn: ele.checkIn
                }
              },
              create: ele,
              update: {}
            }).then(async data => {
              console.log("Biometric data added successfully, ID:", data.id);
              this.success = this.success + 1;
            })
              .catch(err => {
                this.failedRecords++;
                this.errorReport.push({
                  message: err.message,
                  reference: reference
                })
                this.errorRecords.push(uploadData)
                console.log("Error while adding record", err.message);
              })
            allRecordsCreated.push(r);
          })
          await Promise.all(allRecordsCreated);
        }
      } catch (err) {
        this.failedRecords++;
        this.errorReport.push({
          message: err.message,
          reference: (err.reference) ? err.reference : reference
        })
        this.errorRecords.push(uploadData)
        console.log("Error", err.message, (err.reference) ? err.reference : reference)
        console.log(err);
      }
    }, 3000)
  }

  initializeDateAndTime(dateInput: string, timeInput: string) {
    const dateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "MMM DD, YYYY", "DD MMM YYYY", "YYYY-MM-DDTHH:mm:ss", "YYYY/MM/DD HH:mm:ss", "DD.MM.YYYY"];

    let parsedDate = null;
    for (const dateFormat of dateFormats) {
      try {
        let momentDate = moment(dateInput, dateFormat, true);
        // const momentDate = moment.tz(__momentDate, 'Asia/Dubai');
        if (momentDate.isValid()) {
          parsedDate = momentDate.toDate();
          break;
        }
      } catch (err) {
        this.logger.error("Moment Date Error", err.message);
      }
    }

    if (parsedDate === null) {
      return null;  // Date parsing failed
    }


    let parsedTime: moment.Moment = null;
    try {
      parsedTime = moment(timeInput, "HH:mm", true);
      if (!parsedTime.isValid()) {
        return null;  // Time parsing failed
      }
    } catch (err) {
      this.logger.error("Moment Time Error", err.message);
    }


    if (parsedTime === null) {
      return null;  // Time parsing failed
    }

    const initializedDateTime = new Date(parsedDate);
    initializedDateTime.setHours(parsedTime.hours());
    initializedDateTime.setMinutes(parsedTime.minutes());

    return initializedDateTime;
  }


  async logBulkPropertyUpload(jobId: number, updateData: Prisma.BiometricsJobUpdateInput) {
    await this.prisma.biometricsJob.update({
      where: {
        id: jobId
      },
      data: updateData
    })

    if (this.jobQueue.length > 0) {
      this.resetData();
      let activeJob = this.jobQueue.shift();
      this.activeJob = activeJob;
      console.log("Starting Job with ID", activeJob);
      this.bulkUploadProperty(activeJob);
    } else {
      console.log("No more jobs in the queue, clearing the available resources");
      this.isProcessing = false;
      this.resetData();

      this.attendanceQueue.add('prepareBulkAttendanceReport',{
        message: "Start Preparing All Attendance Report"
      },{removeOnComplete: true})
    }
  }

  async reportError(jobId: number, message: string) {
    let current = await this.prisma.biometricsJob.findFirst({
      where: {
        id: jobId
      }
    })

    let errorMessage: Prisma.JsonValue = current.failedReport;
    let newErrorData: Prisma.JsonValue = [];
    if (errorMessage && (typeof errorMessage === "object" || Array.isArray(errorMessage))) {
      newErrorData = [errorMessage];
    }
    newErrorData.push({
      message: message,
      errorReportedAt: (new Date()).toLocaleString("en-US", { timeZone: 'Asia/Dubai' })
    });
    await this.prisma.biometricsJob.update({
      where: {
        id: jobId
      },
      data: {
        status: BiometricsJobStatus.failed,
        failedReport: newErrorData
      }
    }).catch(err => {
      this.logger.error("Failed to report error", err.message)
    })
  }

  async clearJob(jobId: number) {
    this.logger.warn(`Manual Job Stop Reuquest received, clearing job ${jobId}`);
    if (jobId === this.activeJob) {
      this.activeJob = null;
    } else {
      await this.prisma.biometricsJob.update({
        where: {
          id: jobId
        },
        data: {
          status: BiometricsJobStatus.failed,
          failedReport: {
            message: "Job Stopped before processing",
            updatedAt: (new Date()).toLocaleString("en-US", { timeZone: 'Asia/Dubai' })
          }
        }
      })
    }
    let filteredJobs = this.jobQueue.filter(function (item) { return item !== jobId })
    this.jobQueue = filteredJobs;
  }
}

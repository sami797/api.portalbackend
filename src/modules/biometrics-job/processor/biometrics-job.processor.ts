import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BulkUploadJobService } from './bulk-upload-job.service';

@Processor('bulk-upload-biometrics')
export class PropertyBulkUploadProcessor {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly bulkUploadJobService: BulkUploadJobService){}


  @Process('bulkUploadBiometrics')
  async handleBulkBiometricsUpload(job: Job) {
    let jobId = job.data?.data?.jobId;
    if(!jobId) return false;
    try{
      this.logger.log("Starting new biometrics upload job", jobId);
      if(this.bulkUploadJobService.isProcessing === false){
        this.bulkUploadJobService.resetData();
        this.bulkUploadJobService.isProcessing = true;
        this.bulkUploadJobService.activeJob = jobId;
        await this.bulkUploadJobService.bulkUploadProperty(jobId);
      }else{
        this.bulkUploadJobService.jobQueue.push(jobId);
        console.log(this.bulkUploadJobService.jobQueue);
      }
    }catch(err){
      console.log("Bulk Property Process Error", err.message)
        this.bulkUploadJobService.reportError(jobId, err.message);
    }
  }


  @Process('stopBulkUploadBiometrics')
  async stopBulkBiometricsUpload(job: Job) {
    let jobId = job.data?.data?.jobId;
    if(!jobId) return false;
    try{
     await this.bulkUploadJobService.clearJob(jobId);
    }catch(err){
        this.bulkUploadJobService.reportError(jobId, err.message);
        console.log("Stop Property Process Error", err.message)
    }
  }

  @Process()
  globalHandler(job: Job) {
    this.logger.error('No listners were provided, fall back to default', job.data);
  }
}

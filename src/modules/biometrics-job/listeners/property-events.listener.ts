import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { BiometricsJobProcessEvent } from '../dto/biometrics-jobs.dto';

@Injectable()
export class BiometricsJobEventListener {
  constructor(
    @InjectQueue('biometricsJob') private propertyQueue: Queue
  ){}
  @OnEvent('biometricsJob.published')
  async handleBiometricsJobProcessEvent(event: BiometricsJobProcessEvent) {
    console.log(event);
    // this.propertyQueue.add('processBiometricsExcelUpload',{
    //   message: "Process Job Request Received",
    //   data: event
    // },{removeOnComplete: true, delay: 5000})
  }
}
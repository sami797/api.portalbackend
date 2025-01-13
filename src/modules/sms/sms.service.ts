import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import axios from 'axios';
import { ResponseError } from 'src/common-types/common-types';
import { KnownSMSGateways, TEST_PHONE } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateSmDto } from './dto/create-sm.dto';
import { SMSLogsFiltersDto } from './dto/sms-logs-filters.dto';
import { SMSLogsPaginationDto } from './dto/sms-logs-pagination.dto';
import { SMSLogsSortingDto } from './dto/sms-logs-sorting.dto';
import { UpdateSmDto } from './dto/update-sm.dto';
import { SMS_CREDENTIALS } from './sms-default-credentials';
import { SMSData } from './types/send-sms.type';

@Injectable()
export class SmsService {

  private readonly logger = new Logger(SmsService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createSmDto: CreateSmDto) {
    let otherGateways = await this.prisma.smsConfiguration.findFirst({
      where: {
        isDefault: true,
        countryId: createSmDto.countryId,
        test: createSmDto.test
      }
    })

    if (!otherGateways) {
      createSmDto['isDefault'] = true;
    }

    return this.prisma.smsConfiguration.create({
      data: createSmDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll() {
    // throw new Error;
    let records = this.prisma.smsConfiguration.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        addedDate : 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.smsConfiguration.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateSmDto: UpdateSmDto) {
    return this.prisma.smsConfiguration.update({
      data: updateSmDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async remove(id: number) {
    let recordData = await this.findOne(id);
    if (!recordData) {
      throw { message: "Record to delete not found", statusCode: 400 }
    }
    let otherGateways = await this.prisma.smsConfiguration.findFirst({
      where: {
        isDefault: true,
        countryId: recordData.countryId,
        test: (recordData.test === false) ? false : true,
        NOT: {
          id: id
        }
      }
    })

    if (!otherGateways) {
      throw { message: "A country must have at least one default payment gateway. Please create at least one default gateway to delete this record", statusCode: 400 }
    }

    return this.prisma.smsConfiguration.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async makeDefault(id: number) {
    let recordData = await this.findOne(id);
    if (!recordData) {
      throw { message: "Provided SMS Gateway ID not found.", statusCode: 400 }
    }

    await this.prisma.smsConfiguration.updateMany({
      where: {
        countryId: recordData.countryId,
        test: recordData.test
      },
      data: {
        isDefault: false
      }
    })

    return this.prisma.smsConfiguration.update({
      where: {
        id: id
      },
      data: { isDefault: true }
    })
  }

  async sendSms(smsData: SMSData) {
    if((smsData.phone === TEST_PHONE && smsData.smsType === 'T') 
    // || process.env.ENVIRONMENT === "development"
    ){
      return
    }
    const {phoneCode} = smsData;

    let country = await this.prisma.country.findFirst({
      where: {
        phoneCode: phoneCode
      },
      select:{
        id: true
      }
    });

    if(!country || !country.id){
      throw {
        message: `Cannot send sms to ${smsData.phoneCode} - ${smsData.phone}. We are not operating to the country specified. Please try again with some other local number `,
        statusCode: 400
      }
    }

    let smsGateways = await this.prisma.smsConfiguration.findFirst({
      where: {
        countryId: country.id,
        test: (process.env.ENVIRONMENT==="development") ? true : false,
        isPublished: true,
        senderIdType: smsData.smsType,
        isDeleted: false
      }
    })

    if(smsGateways){
      smsData.gateway = smsGateways;
      this.logSms(smsData);
      switch(smsGateways.slug){
        case KnownSMSGateways['SMS-ALA']: 
        case KnownSMSGateways['SMS-ALA-TEST'] : this.sendSMSUsingSMSAlaGateway(smsData); break;
        case KnownSMSGateways['SMS-COUNTRY']: 
        case KnownSMSGateways['SMS-COUNTRY-TEST'] : this.sendSMSUsingCountrySMSgateway(smsData); break;
        default: this.logger.error("Error on:"+ this.constructor.name +"\n Error code: NO_SMS_GATEWAY. \n No default SMS gateway found. Please set a default SMS gateway to send an SMS"); break;
      }
    }
  
  }

  async logSms (smsData: SMSData) {
    await this.prisma.smsLogs.create({
      data:{
        gateway: smsData.gateway.slug,
        message: smsData.message,
        number: smsData.phoneCode + smsData.phone,
        sentDate: new Date(),
        userId: (smsData.user) ? smsData.user?.userId : undefined
      }
    })
  }

  sendSMSUsingSMSAlaGateway(smsData: SMSData){

    let data = {
      api_id: smsData.gateway.appId,
      api_password: smsData.gateway.appPassword,
      sender_id: smsData.gateway.senderId,
      encoding: 'T',
      sms_type: (smsData.smsType) ? smsData.smsType : 'T'
    }

    axios.post(smsData.gateway.gateway + (Array.isArray(smsData.phone) ? "SendSMSMulti" : "SendSMS"), {
      ...data,
      phonenumber: (Array.isArray(smsData.phone)) ?  smsData.phone.join(',') : smsData.phone
    }).then(response => {
      console.log(response.data)
    }).catch(err => {
      this.logger.log("Error while sending sms. Custom Error Code: SMS-ALA-193 \n", err.message);
    })

  }

  sendSMSUsingCountrySMSgateway(smsData: SMSData){

    let data  = {
      Text: smsData.message,
      Number: smsData.phoneCode+smsData.phone,
      SenderId: smsData.gateway.senderId,
      DRNotifyUrl: "https://d777-94-205-243-22.in.ngrok.io/sms/countrySms-response",
      DRNotifyHttpMethod: "POST",
      Tool: "API"
    }

    let authToken =  Buffer.from( smsData.gateway.appId+":"+smsData.gateway.appPassword);
    let authEncoded = authToken.toString('base64');
    let headers = {
      "Content-Type": "application/json",
      "Authorization": "Basic " + authEncoded
    }
    axios({
      method: 'POST',
      url: smsData.gateway.gateway + `Accounts/${smsData.gateway.appId}/SMSes`,
      data: data,
      headers: headers
    }).then(response => {
    }).catch(err => {
      this.logger.error("Error while sending sms. Custom Error Code: SMS-COUNTRY-239 \n", err);
    })
  }

  findSmsLogs(pagination: SMSLogsPaginationDto, sorting: SMSLogsSortingDto, condition: Prisma.SmsLogsWhereInput){
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.SmsLogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder};
    return this.prisma.smsLogs.findMany({
      where: condition,
      skip: skip,
      take: take,
      orderBy: __sorter,
    });
  }


  applyFilters(filters: SMSLogsFiltersDto){
    let condition : Prisma.SmsLogsWhereInput= {}

    if(Object.entries(filters).length > 0){

      if(filters.status){
        condition = {...condition, status: filters.status}
      }

      if(filters.fromDate && filters.toDate){
        condition = {...condition, AND: [ 
          {
            sentDate: {
              gte: new Date(filters.fromDate + "T00:00:00")
            }
          },
          {
            sentDate: {
              lte: new Date(filters.toDate + "T23:59:59")
            }
          }
      ]}
      }else{
        if(filters.fromDate){
          condition = {...condition, sentDate: { gte: new Date(filters.fromDate + "T00:00:00")}}
        }

        if(filters.toDate){
          condition = {...condition, sentDate: { lte: new Date(filters.toDate + "T23:59:59")}}
        }
      }

      if(filters.userId){
        condition = {...condition, userId: filters.userId}
      }


      if(filters.message){
        condition = {...condition, message: {
          contains: filters.message,
          mode: 'insensitive'
        }}
      }

      if(filters.gateway){
        condition = {...condition, gateway: filters.gateway}
      }

      if(filters.number){
        condition = {...condition, number: filters.number}
      }

    }

    return condition;
  }

  countTotalRecord(condition: Prisma.SmsLogsWhereInput){
    return this.prisma.smsLogs.count({
      where: condition
    })
  }


}

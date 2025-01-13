import { Global, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SystemLogsType } from './types/system-logs.types';

@Injectable()
export class SystemLogger {
  constructor(private readonly prismaService: PrismaService){}
  async logData(systemLogsType: SystemLogsType) {
    let logData : Prisma.SystemLogsUncheckedCreateInput = {
      table: systemLogsType.tableName,
      actionType: systemLogsType.actionType,
      tableColumnKey: systemLogsType.field,
      tableColumnValue: systemLogsType.value.toString(),
      valueType: systemLogsType.valueType,
      addedById: systemLogsType.user,
      message: systemLogsType.message,
      data: systemLogsType.data,
      controllerName: systemLogsType.controllerName,
      endPoint: systemLogsType.endPoint,
    }

    await this.prismaService.systemLogs.create({
      data: logData
    })

  }
}

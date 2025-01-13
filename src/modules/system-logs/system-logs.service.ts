import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SystemLogsFiltersDto } from './dto/system-logs-filters.dto';
import { SystemLogsPaginationDto } from './dto/system-logs-pagination.dto';
import { SystemLogsSortingDto } from './dto/system-logs-sorting.dto';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) { }

  findSystemLogs(pagination: SystemLogsPaginationDto, sorting: SystemLogsSortingDto, condition: Prisma.SystemLogsWhereInput){
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.SystemLogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder};
    return this.prisma.systemLogs.findMany({
      where: condition,
      include:{
        AddedBy: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: true
          }
        },
      },
      skip: skip,
      take: take,
      orderBy: __sorter,
    });
  }


  applyFilters(filters: SystemLogsFiltersDto){
    let condition : Prisma.SystemLogsWhereInput= {}

    if(Object.entries(filters).length > 0){

      if(filters.fromDate && filters.toDate){
        condition = {...condition, AND: [ 
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
      ]}
      }else{
        if(filters.fromDate){
          condition = {...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00")}}
        }

        if(filters.toDate){
          condition = {...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59")}}
        }
      }

      if(filters.table){
        condition = {...condition, table: filters.table}
      }

      if(filters.tableColumnKey){
        condition = {...condition, tableColumnKey: {
          contains: filters.tableColumnKey,
          mode: 'insensitive'
        }}
      }


      if(filters.tableColumnValue){
        condition = {...condition, tableColumnValue: {
          contains: filters.tableColumnValue,
          mode: 'insensitive'
        }}
      }
      
      if(filters.addedById){
        condition = {...condition, addedById: filters.addedById}
      }

    }

    return condition;
  }

  countTotalRecord(condition: Prisma.SystemLogsWhereInput){
    return this.prisma.systemLogs.count({
      where: condition
    })
  }
  
}

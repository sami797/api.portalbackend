import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryFilters } from './dto/diary-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ProjectDefaultAttributes } from '../project/dto/project.dto';

@Injectable()
export class DiaryService {

  private readonly logger = new Logger(DiaryService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateDiaryDto) {

    return this.prisma.dailyRoutine.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  async findAll(filters: Prisma.DailyRoutineWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = await this.prisma.dailyRoutine.findMany({
      where: filters,
      skip: skip,
      take: take,
      include: {
        Project: {
          select: ProjectDefaultAttributes
        },
        TaskType: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        User: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            profile: true,
            email: true
          }
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });

    // let projectIds = records.forEach((ele) => ele.)

    return records;
  }

  findOne(id: number) {
    return this.prisma.dailyRoutine.findUnique({
      where: {
        id: id
      },
      include: {
        Project: {
          select: ProjectDefaultAttributes
        },
        TaskType: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        User: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            profile: true,
            email: true
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateDiaryDto) {

    return this.prisma.dailyRoutine.update({
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

  remove(id: number) {
    return this.prisma.dailyRoutine.update({
      data: {
        isPublished: false,
        isDeleted: true
      },
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  applyFilters(filters: DiaryFilters) {
    let condition: Prisma.DailyRoutineWhereInput = {
      isDeleted: false
    };

    if (filters?.fromDate && filters?.toDate) {
      let st = new Date(filters.fromDate);
      let en = new Date(filters.toDate);
      let diff = st.valueOf() - en.valueOf();
      let differenceInDays = Math.abs(diff / (24 * 60 * 60 * 1000));
      if (differenceInDays > 30) { //greater than 30 days should not be allowed
        en.setDate(en.getDate() - 30);
        filters.fromDate = en.toISOString().split('T')[0]
      }
    }
    else if (filters?.fromDate && !filters.toDate) {
      let en = new Date(filters.fromDate);
      en.setDate(en.getDate() + 30);
      filters.toDate = en.toISOString().split('T')[0]
    }
    else if (!filters?.fromDate && filters.toDate) {
      let en = new Date(filters.toDate);
      en.setDate(en.getDate() - 30);
      filters.fromDate = en.toISOString().split('T')[0]
    } else {
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filters.toDate = yesterday.toISOString().split('T')[0]

      let en = new Date();
      en.setDate(en.getDate() - 30);
      filters.fromDate = en.toISOString().split('T')[0]
    }

    if (Object.entries(filters).length > 0) {
      if (filters.projectId) {
        condition = {
          ...condition,
          projectId: filters.projectId
        }
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

  countRecords(filters: Prisma.DailyRoutineWhereInput) {
    return this.prisma.dailyRoutine.count({
      where: filters
    })
  }

  async findEmployeesUnderUser<T>(user: AuthenticatedUser): Promise<Partial<User>[]> {
    const userId = user.userId;
    const depth = 4;
    const query = `
    WITH RECURSIVE EmployeeCTE AS (
      SELECT "id", "firstName", "lastName", "managerId", 1 AS depth
      FROM "User"
      WHERE "id" = ${userId}
      UNION ALL
      SELECT u."id", u."firstName", u."lastName", u."managerId", cte.depth + 1
      FROM "User" AS u
      INNER JOIN EmployeeCTE AS cte ON u."managerId" = cte.id
      WHERE cte.depth < ${depth}
    )
    SELECT * FROM EmployeeCTE WHERE "id" != ${userId};
  `;

    const employees = await this.prisma.$queryRawUnsafe(query);
    return employees as any;
  }


  findUserReport1(users: Partial<User>[]) {
    let userIds = users.map((ele) => ele.id);
    return this.prisma.dailyRoutine.groupBy({
      by: ["userId", "addedDate"],
      where: {
        userId: {
          in: userIds
        }
      }
    })
  }

  async findUserReport(filters: Prisma.DailyRoutineWhereInput, pagination: Pagination, users: Partial<User>[]) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let userIds = users.map((ele) => ele.id);
    let records = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        profile: true,
        email: true,
        DailyRoutine: {
          where: filters,
          skip: skip,
          take: take,
          include: {
            Project: {
              select: ProjectDefaultAttributes
            },
            TaskType: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
          },
          orderBy: {
            addedDate: 'desc'
          }
        }
      }
    });
    return records;
  }

  async findUserReportByUserId(userId: number, filters: Prisma.DailyRoutineWhereInput) {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select:{
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        profile: true,
        email: true,
        DailyRoutine: {
          where: filters,
          select:{
            addedDate: true,
            remarks: true,
            noOfHours: true,
            Project: {
              select: ProjectDefaultAttributes
            },
            TaskType: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
          }
        }
      }
    });

    if (!userData) {
      console.log('User not found.');
      return;
    }

    let totalHoursWorked = await this.prisma.dailyRoutine.aggregate({
      where:{
        userId: userData.id,
        isDeleted: false,
      },
      _sum:{
        noOfHours: true
      }
    })

    // Group daily routines by date
    const dailyRoutinesByDate = new Map();
    userData.DailyRoutine.forEach((routine) => {
      const date = routine.addedDate.toISOString().slice(0, 10); // Extract YYYY-MM-DD
      if (!dailyRoutinesByDate.has(date)) {
        dailyRoutinesByDate.set(date, []);
      }
      dailyRoutinesByDate.get(date).push({
        ...routine
      });
    });

    // Prepare the response
    const response = {
      ...userData,
      totalHours: totalHoursWorked._sum.noOfHours,
      dailyRoutine: Array.from(dailyRoutinesByDate).map(([date, routines]) => ({
        date,
        routines,
      })),
    };

    return response

  }
}


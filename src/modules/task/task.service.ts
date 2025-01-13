
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileVisibility, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilters } from './dto/task-filters.dto';
import { UpdateTaskOrderDto } from './dto/update-task-order.dto';
import { TaskSortingDto } from './dto/task-sorting.dto';
import { UploadTaskFiles } from './dto/upload-files.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { generateUUID, getEnumKeyByValue } from 'src/helpers/common';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { Departments, FileStatus, TaskType, UserStatus } from 'src/config/constants';
import { UpdateTaskMember } from './dto/update-task-member.dto';
import { RemoveTaskMember } from './dto/remove-task-member.dto';

@Injectable()
export class TaskService {

  private readonly logger = new Logger(TaskService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createDto: CreateTaskDto, user: AuthenticatedUser) {
    let { assignedTo, ...rest } = createDto;
    let recordData: Prisma.TaskUncheckedCreateInput = rest;
    if(createDto.taskStartFrom){
      recordData.taskStartFrom = new Date(createDto.taskStartFrom)
    }

    if(createDto.taskEndOn){
      recordData.taskEndOn = new Date(createDto.taskEndOn)
    }

    if(recordData.type === TaskType.techSupport){
      assignedTo = [];
      let allTechSupportUsers = await this.prisma.user.findMany({where:{
        status: UserStatus.active,
        Department:{
          slug: Departments.techSupport
        }
      },
      select:{id: true}
    })

      allTechSupportUsers.forEach((ele) =>{
        assignedTo.push(ele.id)
      })
    }

    return this.prisma.task.create({
      data: {
        ...recordData,
        addedById: user.userId
      },
    })
      .then(async (data) => {
        if (assignedTo && assignedTo.length > 0) {
          let dt: Array<Prisma.TaskMembersCreateManyInput> = [];
          let uniqueUserIds = [];
          assignedTo.forEach((ele) => {
            if (uniqueUserIds.includes(ele)) {
              return
            } else {
              uniqueUserIds.push(ele);
              dt.push({
                userId: ele,
                taskId: data.id
              })
            }
          })

          await this.prisma.taskMembers.createMany({
            data: dt
          }).catch(err => {
            this.logger.error("Error while adding task members");
          })
        }

        await this.prisma.task.update({
          where:{
            id: data.id
          },
          data:{
            order: data.id
          }
        })

        return data
      })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.TaskWhereInput, pagination: Pagination, sorting: TaskSortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;

    let __sorter: Prisma.Enumerable<Prisma.TaskOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };

    let records = this.prisma.task.findMany({
      where: filters,
      skip: skip,
      take: take,
      select:{
        id: true,
        uuid: true,
        title: true,
        addedDate: true,
        taskStartFrom: true,
        taskEndOn: true,
        priority: true,
        status: true,
        order: true,
        _count:{
          select:{
            Resources: {
              where:{
                isDeleted: false
              }
            }
          }
        },
        AddedBy:{
          select:{
            firstName: true,
            lastName: true,
            id: true,
            uuid: true,
            profile: true,
            email: true
          }
        },
        ClosedBy:{
          select:{
            firstName: true,
            lastName: true,
            id: true,
            uuid: true,
            profile: true
          }
        },
        TaskMembers:{
          select:{
            User:{
              select:{
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true
              }
            }
          }
        }
      },
      orderBy: __sorter
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.task.findUnique({
      where: {
        id: id
      },
      include:{
        Resources:{
          where:{
            isDeleted: false
          },
          select:{
            file: true,
            fileType: true,
            path: true,
            name: true,
            id: true,
            uuid: true,
            addedDate: true
          }
        },
        AddedBy:{
          select:{
            firstName: true,
            lastName: true,
            id: true,
            uuid: true,
            profile: true,
            email: true
          }
        },
        ClosedBy:{
          select:{
            firstName: true,
            lastName: true,
            id: true,
            uuid: true,
            profile: true
          }
        },
        TaskMembers:{
          select:{
            User:{
              select:{
                firstName: true,
                lastName: true,
                profile: true,
                id: true,
                uuid: true,
                email: true
              }
            }
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateTaskDto) {
    let { assignedTo, type, ...rest } = updateDto;
    let recordData : Prisma.TaskUpdateInput = rest;
    if(updateDto.taskStartFrom){
      recordData.taskStartFrom = new Date(updateDto.taskStartFrom)
    }

    if(updateDto.taskEndOn){
      recordData.taskEndOn = new Date(updateDto.taskEndOn)
    }

    return this.prisma.task.update({
      data: recordData,
      where: {
        id: id
      },
      include: {
        TaskMembers: true
      }
    })
      .then(async (data) => {
        if (assignedTo && assignedTo.length > 0) {
          let dt: Array<Prisma.TaskMembersCreateManyInput> = [];
          let toDelete: Array<number> = [];
          let newUserIds = [];

          assignedTo.forEach((taskUser) => {
            let isExisting = data.TaskMembers.find((ele) => ele.userId === taskUser);
            if (!isExisting) {
              newUserIds.push(taskUser);
              dt.push({
                userId: taskUser,
                taskId: data.id
              })
            }
          })

          data.TaskMembers.forEach((ele) => {
            if (!assignedTo.includes(ele.userId)) {
              toDelete.push(ele.userId);
            }
          })

          // await this.prisma.taskMembers.deleteMany({
          //   where: {
          //     userId: {
          //       in: toDelete
          //     },
          //     taskId: data.id
          //   }
          // })


          await this.prisma.taskMembers.createMany({
            data: dt
          }).catch(err => {
            this.logger.error("Error while adding task members");
          })
        }

        return data;
      })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  remove(id: number) {
    return this.prisma.task.update({
      data: {
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

  removeTaskFile(id: number, user: AuthenticatedUser) {
    return this.prisma.fileManagement.update({
      data: {
        isDeleted: true,
        deletedById: user.userId,
        deletedDate: new Date()
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


  applyFilters(filters: TaskFilters, user: AuthenticatedUser, hasGlobalPermission: boolean) {
    let condition: Prisma.TaskWhereInput = {
      isDeleted: false
    };

    if(hasGlobalPermission === false){
      condition = {
        ...condition,
        OR:[
          {
            TaskMembers:{
              some:{
                userId: user.userId
              }
            }
          },
          {
            addedById: user.userId
          }
        ]
      }
    }

    if (Object.entries(filters).length > 0) {

      if(filters.status){
        condition= {
          ...condition,
          status: filters.status
        }
      }

      if(filters.taskType){
        condition= {
          ...condition,
          type: filters.taskType
        }
      }

      if(filters.type){
        if(filters.type === 'assignedTask'){
          if(filters.userIds){
            condition = {
              ...condition,
              addedById: user.userId,
              TaskMembers:{
                some:{
                  userId: {
                    in: filters.userIds
                  }
                }
              }
            }
          }else{
            condition = {
              ...condition,
              addedById: user.userId,
            }
          }
        }else if(filters.type === 'myTask'){
          condition = {
            ...condition,
            TaskMembers:{
              some:{
                userId: user.userId
              }
            }
          }
        }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.TaskWhereInput) {
    return this.prisma.task.count({
      where: filters
    })
  }

  async updateTaskOrder(id: number, updateDto: UpdateTaskOrderDto) {
    let record = await this.prisma.task.findUnique({
      where: {
        id: id
      }
    })

    let currentOrderTask = await this.prisma.task.findFirst({
      where:{
        status: record.status
      },
      orderBy:{
        order: 'asc'
      },
      skip: updateDto.order
    })

    if(!currentOrderTask){
      currentOrderTask = {order: 9999} as any;
    }

    let hasIncreasePosition = true;
    if(currentOrderTask.order > record.order){
      hasIncreasePosition = false; // the task was moved down than the previous value;
    }

    if(hasIncreasePosition){
      await this.prisma.task.updateMany({
        where:{
          status: record.status,
          order: {
            gte: currentOrderTask.order
          },
          NOT:{
            id: id
          }
        },
        data:{
          order:{
            increment: 1
          }
        }
      })
  
      await this.prisma.task.update({
        where:{
          id: id
        },
        data:{
          order: currentOrderTask.order
        }
      })
    }else{
      await this.prisma.task.updateMany({
        where:{
          status: record.status,
          order: {
            lte: currentOrderTask.order
          },
          NOT:{
            id: id
          }
        },
        data:{
          order:{
            decrement: 1
          }
        }
      })
  
      await this.prisma.task.update({
        where:{
          id: id
        },
        data:{
          order: currentOrderTask.order
        }
      })
    }
  }

  async handleTaskFiles(uploadPropertyFiles: UploadTaskFiles, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let property = await this.prisma.task.findUnique({
      where: {
        id: uploadPropertyFiles.taskId
      }
    })

    if (!property) {
      throw new NotFoundException({ message: "Task with the provided taskId not Found", statusCode: 400 })
    }
    let insertedIds = []
    let insertData: Array<Prisma.FileManagementCreateInput> = files.map((ele, index) => {
      let uuid = generateUUID();
      insertedIds.push(uuid)
      let newRecord : Prisma.FileManagementUncheckedCreateInput = {
        uuid: uuid,
        documentType: "taskFiles",
        title: ele.originalname,
        name: ele.originalname,
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        isTemp: false,
        status: FileStatus.Verified,
        addedById: user.userId,
        visibility: FileVisibility.organization,
        taskId: uploadPropertyFiles.taskId,
        fileSize: ele.size / 1024 //in KB
      }
      return newRecord
    });

    if (insertData.length > 0) {
      await this.prisma.fileManagement.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })
      return this.prisma.fileManagement.findMany({
        where: {
          uuid: {
            in: insertedIds
          }
        },
        select: {
          id: true,
          uuid: true,
          file: true,
          name: true,
          isTemp: true,
          projectId: true,
          path: true
        }
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return []
    }
  }

  async updateTaskMember(updateProjectMember: UpdateTaskMember){
    const {assignedTo} = updateProjectMember;
    let data = await this.prisma.task.findFirst({
      where:{
        id: updateProjectMember.taskId,
        isDeleted: false
      },
      include:{
        TaskMembers: true
      }
    })

    if(!data){
      throw {
        message: "No Task Found, or this task might have been removed",
        statusCode: 404
      }
    }

    if (assignedTo && assignedTo.length > 0) {
      let dt: Array<Prisma.TaskMembersCreateManyInput> = [];
      let newUserIds = [];

      assignedTo.forEach((taskUser) => {
        let isExisting = data.TaskMembers.find((ele) => ele.userId === taskUser);
        if (!isExisting) {
          newUserIds.push(taskUser);
          dt.push({
            userId: taskUser,
            taskId: data.id
          })
        }
      })

      if(dt.length > 0){
        await this.prisma.taskMembers.createMany({
          data: dt
        }).catch(err => {
          this.logger.error("Error while adding task members");
        })

        data = await this.prisma.task.findFirst({
          where:{
            id: updateProjectMember.taskId,
            isDeleted: false
          },
          include:{
            TaskMembers: true
          }
        })
      }
    }

    return data
  }

  removeTaskMember(removeTaskMember : RemoveTaskMember){
    return this.prisma.taskMembers.deleteMany({
      where:{
        taskId: removeTaskMember.taskId,
        userId: removeTaskMember.userId
      }
    })
  }
}


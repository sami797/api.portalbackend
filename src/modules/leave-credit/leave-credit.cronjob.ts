
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { User } from '@prisma/client';
import { Queue } from 'bull';
import { UserStatus } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import * as BluebirdPromise from 'bluebird';


@Injectable()
export class LeaveCreditCronJob {
    private readonly logger = new Logger(LeaveCreditCronJob.name);
    constructor(private readonly prisma: PrismaService) {}

    @Cron('0 0 1 * *')
    async addLeaveCreditsReport() {
        this.logger.log("Called every month on 1st at 00:00AM to add leave credits");
        const rawQuery = `
        SELECT *
        FROM "User"
        WHERE 
        EXTRACT(MONTH FROM age(CURRENT_DATE, "dateOfJoining")) % 3 = 0
        AND "status" = ${UserStatus.active}`;
        const allUsers: Array<User> = await this.prisma.$queryRawUnsafe(rawQuery);

        const MAX_CONCURRENT_OPERATIONS = 10;
        await BluebirdPromise.map(allUsers, async (ele) => {    
            await this.prisma.leaveCredits.create({
                data:{
                    userId: ele.id,
                    daysCount: 30,
                    note: "Leave Credits Auto Added By System"
                }
            })
      }, { concurrency: MAX_CONCURRENT_OPERATIONS });

    }
}
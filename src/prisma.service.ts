import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      errorFormat: 'minimal',
      // log: ['query'] // Uncomment for query logging
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Uncomment to add middleware for custom logic
    // this.$use(async (params, next) => {
    //   const result = await next(params);
    //   if (result === null) return {}; // Return empty object if null
    //   return result;
    // });
  }

  // Uncomment if you want to enable graceful shutdown
  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }

  async truncate() {
    const records = await this.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'`
    );

    for (const record of records) {
      await this.truncateTable(record.tablename);
    }
  }

  async truncateTable(tablename: string) {
    if (!tablename || tablename === '_prisma_migrations') {
      return;
    }
    try {
      await this.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      );
    } catch (error) {
      console.error(`Error truncating table ${tablename}:`, error);
    }
  }

  async resetSequences() {
    const results = await this.$queryRawUnsafe<Array<{ relname: string }>>(
      `SELECT c.relname
       FROM pg_class AS c
       JOIN pg_namespace AS n ON c.relnamespace = n.oid
       WHERE c.relkind = 'S'
       AND n.nspname = 'public'`
    );

    for (const { relname } of results) {
      await this.$executeRawUnsafe(
        `ALTER SEQUENCE "public"."${relname}" RESTART WITH 1;`
      );
    }
  }
}

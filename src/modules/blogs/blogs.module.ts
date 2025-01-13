import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService, AuthorizationService]
})
export class BlogsModule {}

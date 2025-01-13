import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { DiaryAuthorizationService } from './diary.authorization.service';

@Module({
  controllers: [DiaryController],
  providers: [DiaryService, DiaryAuthorizationService]
})
export class DiaryModule {}

import { Module } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchesController } from './saved-searches.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, AuthorizationService]
})
export class SavedSearchesModule {}

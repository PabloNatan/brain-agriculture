import { Module } from '@nestjs/common';
import { CultureTypeService } from './culture-type.service';
import { CultureTypeController } from './culture-type.controller';

@Module({
  controllers: [CultureTypeController],
  providers: [CultureTypeService],
})
export class CultureTypeModule {}

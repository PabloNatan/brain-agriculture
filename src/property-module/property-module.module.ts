import { Module } from '@nestjs/common';
import { PropertyModuleService } from './property-module.service';
import { PropertyModuleController } from './property-module.controller';

@Module({
  controllers: [PropertyModuleController],
  providers: [PropertyModuleService],
})
export class PropertyModuleModule {}

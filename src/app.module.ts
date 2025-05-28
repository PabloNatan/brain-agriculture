import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomConfigModule } from './custom-config/custom-config.module';
import { ProducerModule } from './producer/producer.module';
import { CultureTypeModule } from './culture-type/culture-type.module';
import { SeasonModule } from './season/season.module';
import { PropertyModuleModule } from './property-module/property-module.module';

@Module({
  imports: [CustomConfigModule, PrismaModule, ProducerModule, CultureTypeModule, SeasonModule, PropertyModuleModule],
  providers: [],
  exports: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomConfigModule } from './custom-config/custom-config.module';
import { ProducerModule } from './producer/producer.module';
import { CultureTypeModule } from './culture-type/culture-type.module';
import { SeasonModule } from './season/season.module';
import { PropertyModule } from './property/property.module';
import { CropModule } from './crop/crop.module';

@Module({
  imports: [
    CustomConfigModule,
    PrismaModule,
    ProducerModule,
    PropertyModule,
    CultureTypeModule,
    SeasonModule,
    CropModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}

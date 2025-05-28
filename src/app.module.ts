import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomConfigModule } from './custom-config/custom-config.module';
import { ProducerModule } from './producer/producer.module';

@Module({
  imports: [CustomConfigModule, PrismaModule, ProducerModule],
  providers: [],
  exports: [],
})
export class AppModule {}

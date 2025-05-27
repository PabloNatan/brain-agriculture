import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CustomConfigModule } from './custom-config/custom-config.module';

@Module({
  imports: [CustomConfigModule, PrismaModule],
})
export class AppModule {}

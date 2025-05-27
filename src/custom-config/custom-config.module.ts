import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import { CustomConfigService } from './custom-config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}

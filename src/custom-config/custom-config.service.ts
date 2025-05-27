import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvConfig } from './env.validation';

@Injectable()
export class CustomConfigService {
  constructor(private configService: NestConfigService<EnvConfig, true>) {}

  // Type-safe environment variable access
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.configService.get(key, { infer: true });
  }

  // Convenience getters for common config
  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get port(): number {
    return this.get('PORT');
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV');
  }
}

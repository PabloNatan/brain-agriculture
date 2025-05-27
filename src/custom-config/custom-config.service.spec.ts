import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CustomConfigService } from './custom-config.service';
import { EnvConfig } from './env.validation';

describe('CustomConfigService', () => {
  let service: CustomConfigService;
  let configService: ConfigService<EnvConfig, true>;
  let getSpy: jest.SpyInstance;

  const mockEnvConfig: EnvConfig = {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    PORT: 3000,
    NODE_ENV: 'test',
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CustomConfigService>(CustomConfigService);
    configService = module.get(ConfigService);
    getSpy = jest.spyOn(configService, 'get');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should call configService.get with correct parameters', () => {
      const expectedValue = 'test-value';
      getSpy.mockReturnValue(expectedValue);

      const result = service.get('DATABASE_URL');

      expect(getSpy).toHaveBeenCalledWith('DATABASE_URL', {
        infer: true,
      });
      expect(result).toBe(expectedValue);
    });

    it('should return the correct value for any valid key', () => {
      getSpy.mockReturnValue(mockEnvConfig.PORT);

      const result = service.get('PORT');

      expect(result).toBe(mockEnvConfig.PORT);
    });
  });

  describe('databaseUrl', () => {
    it('should return DATABASE_URL from config', () => {
      getSpy.mockReturnValue(mockEnvConfig.DATABASE_URL);

      const result = service.databaseUrl;

      expect(getSpy).toHaveBeenCalledWith('DATABASE_URL', {
        infer: true,
      });
      expect(result).toBe(mockEnvConfig.DATABASE_URL);
    });
  });

  describe('port', () => {
    it('should return PORT from config', () => {
      getSpy.mockReturnValue(mockEnvConfig.PORT);

      const result = service.port;

      expect(getSpy).toHaveBeenCalledWith('PORT', { infer: true });
      expect(result).toBe(mockEnvConfig.PORT);
    });
  });

  describe('nodeEnv', () => {
    it('should return NODE_ENV from config', () => {
      getSpy.mockReturnValue(mockEnvConfig.NODE_ENV);

      const result = service.nodeEnv;

      expect(getSpy).toHaveBeenCalledWith('NODE_ENV', {
        infer: true,
      });
      expect(result).toBe(mockEnvConfig.NODE_ENV);
    });
  });
});

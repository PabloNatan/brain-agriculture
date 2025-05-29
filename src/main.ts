import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomConfigService } from './custom-config/custom-config.service';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(CustomConfigService);
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new ZodExceptionFilter());

  app.use('/', (req, res, next) => {
    if (req.url === '/' || req.url === '/api') {
      return res.redirect('/docs');
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Brain Agriculture API')
    .setDescription('API to manage the registration of rural producers')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.port;

  await app.listen(port ?? 4000);
}
bootstrap();

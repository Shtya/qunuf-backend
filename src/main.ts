import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, VersioningType } from '@nestjs/common';
import { CustomValidationPipe } from './common/pipes/customValidation.pipe';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: [
      'http://localhost:3000', // for testing purposes
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,x-lang',
    exposedHeaders: 'Content-Length,Content-Range',
  });
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });


  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useStaticAssets(join(__dirname, '..', '/uploads'), { prefix: '/uploads/' });

  const customValidationPipe = app.get(CustomValidationPipe);
  app.useGlobalPipes(customValidationPipe);

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Qunuf API')
    .setDescription('API docs for Qunuf Real Estate')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve raw OpenAPI JSON at /api-json
  app.getHttpAdapter().getInstance().get('/api-json', (req, res) => {
    res.json(document);
  });


  const port = process.env.PORT || 8081;
  Logger.log(`🚀 server is running on port ${port}`);
  await app.listen(port);
}
bootstrap();

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv') ?? 'development';
  const port = configService.get<number>('app.port') ?? 3000;
  const corsOrigins = configService.get<string>('app.corsOrigins') ?? '';

  app.use(helmet());
  app.use(compression());

  const origins = corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableVersioning({ type: VersioningType.URI });

  let swaggerEnabled = false;

  if (nodeEnv !== 'production') {
    swaggerEnabled = true;
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ding Payments API')
      .setDescription('Self-custodial Stellar P2P payments via NFC')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/v1/docs', app, document);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(port);

  Logger.log(`🚀 Server running on http://localhost:${port}/v1`, 'Bootstrap');
  if (swaggerEnabled) {
    Logger.log(`📚 Swagger docs at http://localhost:${port}/v1/docs`, 'Bootstrap');
  }
}

void bootstrap();

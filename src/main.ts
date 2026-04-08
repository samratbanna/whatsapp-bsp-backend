import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UsersService } from './modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger — dev only
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('WhatsApp BSP API')
      .setDescription('WhatsApp Business Solution Provider — Admin API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth')
      .addTag('Users')
      .addTag('Organizations')
      .addTag('App Config')
      .addTag('WABA')
      .addTag('Webhook')
      .addTag('Messages')
      .addTag('Templates')
      .addTag('Contacts')
      .addTag('Campaigns')
      .addTag('Flow Builder')
      .addTag('API Keys')
      .addTag('Analytics')
      .addTag('Wallet')
      .addTag('Pricing')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📖 Swagger: http://localhost:${config.get('PORT', 3000)}/api/docs`);
  }

  // Seed
  const usersService = app.get(UsersService);
  await usersService.seedSuperAdmin(
    config.get('ADMIN_EMAIL', 'admin@yourdomain.com'),
    config.get('ADMIN_PASSWORD', 'Admin@123456'),
  );

  const port = config.get('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}/api/v1`);
}

bootstrap();

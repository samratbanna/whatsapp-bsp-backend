"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const users_service_1 = require("./modules/users/users.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const config = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    if (config.get('NODE_ENV') !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        console.log(`📖 Swagger: http://localhost:${config.get('PORT', 3000)}/api/docs`);
    }
    const usersService = app.get(users_service_1.UsersService);
    await usersService.seedSuperAdmin(config.get('ADMIN_EMAIL', 'admin@yourdomain.com'), config.get('ADMIN_PASSWORD', 'Admin@123456'));
    const port = config.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 Server: http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map
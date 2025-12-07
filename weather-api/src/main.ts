import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Weather System API')
    .setDescription('API para coleta, processamento e análise de dados meteorológicos com integração PokéAPI')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e registro de usuários')
    .addTag('users', 'Gerenciamento de usuários')
    .addTag('weather', 'Logs e estatísticas meteorológicas')
    .addTag('pokemon', 'Integração com PokéAPI')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Weather System API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API rodando em http://localhost:${port}/api`);
  console.log(`📚 Swagger disponível em http://localhost:${port}/api/docs`);
}
bootstrap();
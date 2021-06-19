import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors(
    {
      origin: [process.env.FRONT_URL],
      credentials: true,
      exposedHeaders: ['Access-Token', 'Refresh-Token', 'Client-Token', 'Country', 'Content-Type'],
      methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS']
    }
  );

  const config = new DocumentBuilder()
    .setTitle('Authentication and user microservice')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('authentication, authorization, user')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();

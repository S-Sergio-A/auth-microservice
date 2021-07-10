import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
// import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
// import helmet from "helmet";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  // app.use(helmet());
  // app.enableCors({
  //   origin: [process.env.FRONT_URL],
  //   credentials: true,
  //   exposedHeaders: ["Access-Token", "Refresh-Token", "Client-Token", "Country", "Content-Type"],
  //   methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"]
  // });

  // const config = new DocumentBuilder()
  //   .setTitle("Authentication and entrance microservice")
  //   .setDescription("The cats API description")
  //   .setVersion("1.0")
  //   .addTag("authentication, authorization, entrance")
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup("api", app, document);

  // await app.listen(6000);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      url: `redis://${process.env.REDIS_DB_NAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_ENDPOINT}:${process.env.REDIS_PORT}`,
      retryDelay: 3000,
      retryAttempts: 10
    }
  });

  app.listen(() => console.log("Microservice is listening"));
}

bootstrap();

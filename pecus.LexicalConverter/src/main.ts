import 'reflect-metadata';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // ConfigServiceを取得するために一時的にアプリケーションを作成
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const port = configService.get<number>('GRPC_PORT');
  const host = configService.get<string>('GRPC_HOST') ?? '0.0.0.0';

  if (!port) {
    console.error('GRPC_PORT environment variable is required');
    process.exit(1);
  }

  await appContext.close();

  // gRPCマイクロサービスとして起動
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'pecus.lexical',
      protoPath: join(__dirname, '../../pecus.Protos/lexical/lexical.proto'),
      url: `${host}:${port}`,
    },
  });

  await app.listen();

  console.log(`🚀 LexicalConverterService is running on ${host}:${port}`);
}

bootstrap();

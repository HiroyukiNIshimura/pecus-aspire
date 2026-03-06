import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // ConfigServiceを取得するために一時的にアプリケーションを作成
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const port = configService.get<number>('GRPC_PORT');
  const host = configService.get<string>('GRPC_HOST') ?? '0.0.0.0';
  const protoPath = configService.get<string>('LEXICAL_PROTO_PATH');
  const metricsPort = configService.get<number>('METRICS_PORT') ?? 9101;

  if (!port) {
    console.error('GRPC_PORT environment variable is required');
    process.exit(1);
  }

  if (!protoPath) {
    console.error('LEXICAL_PROTO_PATH environment variable is required');
    process.exit(1);
  }

  await appContext.close();

  // HTTP サーバー（メトリクス・ヘルスチェック用）を起動
  const httpApp = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await httpApp.listen(metricsPort, '0.0.0.0');
  console.log(`📊 Metrics server is running on http://0.0.0.0:${metricsPort}/metrics`);

  // gRPCマイクロサービスとして起動
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'pecus.lexical',
      protoPath: protoPath,
      url: `${host}:${port}`,
      loader: {
        keepCase: true,
      },
      // 最大メッセージサイズを20MBへ拡張 (デフォルト4MB)。長文の保存に対応。
      // [懸念と対策] 巨大なJSONのパースと変換はCPUバウンドな処理であり、同時に多数の
      // リクエストが到達するとメモリ・CPUスパイクが発生する可能性がありますが、
      // 呼び出し元(Hangfire)で並列数が制御され、失敗時も自動リトライされる設計になっています。
      // 常時高負荷となる場合は、このコンテナのスケールアウトを検討してください。
      channelOptions: {
        'grpc.max_receive_message_length': 20 * 1024 * 1024,
        'grpc.max_send_message_length': 20 * 1024 * 1024,
      },
    },
  });

  await app.listen();

  console.log(`🚀 LexicalConverterService is running on ${host}:${port}`);
}

bootstrap();

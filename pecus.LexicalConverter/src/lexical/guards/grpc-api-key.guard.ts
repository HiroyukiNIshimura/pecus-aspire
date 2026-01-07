import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

/**
 * gRPC API キー認証ガード
 * Metadata の x-api-key を検証し、サービス間通信を保護する
 */
@Injectable()
export class GrpcApiKeyGuard implements CanActivate {
  private readonly validApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.validApiKey = this.configService.get<string>('LEXICAL_GRPC_API_KEY') ?? '';
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'rpc') {
      return true;
    }

    const metadata = context.switchToRpc().getContext();
    const apiKeyValues = metadata.get('x-api-key');
    const apiKey = apiKeyValues?.[0];

    if (!this.validApiKey) {
      return true;
    }

    if (!apiKey || apiKey !== this.validApiKey) {
      throw new RpcException({
        code: 16, // UNAUTHENTICATED
        message: 'Invalid or missing API key',
      });
    }

    return true;
  }
}

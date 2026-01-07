import { Module } from '@nestjs/common';
import { GrpcApiKeyGuard } from './guards';
import { LexicalController } from './lexical.controller';
import { LexicalService } from './lexical.service';

@Module({
  controllers: [LexicalController],
  providers: [LexicalService, GrpcApiKeyGuard],
})
export class LexicalModule {}

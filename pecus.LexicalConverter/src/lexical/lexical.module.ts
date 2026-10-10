import { Module } from '@nestjs/common';
import { GrpcApiKeyGuard } from './guards/index.js';
import { LexicalController } from './lexical.controller.js';
import { LexicalService } from './lexical.service.js';

@Module({
  controllers: [LexicalController],
  providers: [LexicalService, GrpcApiKeyGuard],
})
export class LexicalModule {}

import { Module } from '@nestjs/common';
import { LexicalController } from './lexical.controller';
import { LexicalService } from './lexical.service';

@Module({
  controllers: [LexicalController],
  providers: [LexicalService],
})
export class LexicalModule {}

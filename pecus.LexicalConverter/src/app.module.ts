import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LexicalModule } from './lexical/lexical.module.js';
import { MetricsModule } from './metrics/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LexicalModule,
    MetricsModule,
  ],
})
export class AppModule {}

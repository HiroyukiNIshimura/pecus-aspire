import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LexicalModule } from './lexical/lexical.module';
import { MetricsModule } from './metrics';

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

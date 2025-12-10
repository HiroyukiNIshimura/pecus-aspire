import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LexicalModule } from './lexical/lexical.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LexicalModule,
  ],
})
export class AppModule {}

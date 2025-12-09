import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { LexicalService } from './lexical.service';

export interface ConvertRequest {
  lexicalJson: string;
}

export interface ConvertResponse {
  success: boolean;
  result: string;
  errorMessage?: string;
  processingTimeMs: number;
}

@Controller()
export class LexicalController {
  constructor(private readonly lexicalService: LexicalService) {}

  @GrpcMethod('LexicalConverter', 'ToHtml')
  toHtml(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const result = this.lexicalService.toHtml(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  @GrpcMethod('LexicalConverter', 'ToMarkdown')
  toMarkdown(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const result = this.lexicalService.toMarkdown(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  @GrpcMethod('LexicalConverter', 'ToPlainText')
  toPlainText(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const result = this.lexicalService.toPlainText(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }
}

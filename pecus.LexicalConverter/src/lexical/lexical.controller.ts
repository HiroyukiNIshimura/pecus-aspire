import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { LexicalService } from './lexical.service';

export interface ConvertRequest {
  lexicalJson: string;
}

export interface MarkdownToLexicalRequest {
  markdown: string;
}

export interface ConvertResponse {
  success: boolean;
  result: string;
  errorMessage?: string;
  processingTimeMs: number;
  unknownNodes: string[];
}

@Controller()
export class LexicalController {
  constructor(private readonly lexicalService: LexicalService) {}

  @GrpcMethod('LexicalConverter', 'ToHtml')
  toHtml(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const { result, unknownNodes } = this.lexicalService.toHtml(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
        unknownNodes,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        unknownNodes: [],
      };
    }
  }

  @GrpcMethod('LexicalConverter', 'ToMarkdown')
  toMarkdown(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const { result, unknownNodes } = this.lexicalService.toMarkdown(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
        unknownNodes,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        unknownNodes: [],
      };
    }
  }

  @GrpcMethod('LexicalConverter', 'ToPlainText')
  toPlainText(request: ConvertRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const { result, unknownNodes } = this.lexicalService.toPlainText(request.lexicalJson);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
        unknownNodes,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        unknownNodes: [],
      };
    }
  }

  @GrpcMethod('LexicalConverter', 'FromMarkdown')
  fromMarkdown(request: MarkdownToLexicalRequest): ConvertResponse {
    const startTime = Date.now();
    try {
      const { result, unknownNodes } = this.lexicalService.fromMarkdown(request.markdown);
      return {
        success: true,
        result,
        processingTimeMs: Date.now() - startTime,
        unknownNodes,
      };
    } catch (error) {
      return {
        success: false,
        result: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        unknownNodes: [],
      };
    }
  }
}

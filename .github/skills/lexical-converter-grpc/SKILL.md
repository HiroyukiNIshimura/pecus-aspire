---
name: lexical-converter-grpc
description: 'gRPC 経由で Lexical JSON を HTML/Markdown/PlainText に変換、または Markdown を Lexical JSON に変換する手順と実装ガイド。Use when asked to convert Lexical JSON, Markdown, or plain text via gRPC; when integrating Lexical conversion in .NET (Pecus.Libs) or NestJS (pecus.LexicalConverter); when handling x-api-key auth, unknownNodes, or conversion errors.'
---

# Lexical Converter gRPC Skill

gRPC 経由で Lexical JSON を各形式（HTML/Markdown/PlainText）に変換、または Markdown を Lexical JSON に変換するためのスキル。

参照実装:
- `pecus.Libs/Lexical/LexicalConverterService.cs`
- `pecus.LexicalConverter/src/lexical/lexical.controller.ts`

## When to Use This Skill

- 「Lexical JSON を HTML/Markdown/PlainText に変換したい」
- 「Markdown を Lexical JSON に戻したい」
- gRPC 経由の変換 API を .NET から呼びたい（`Pecus.Libs`）
- gRPC サーバ側（NestJS）で変換メソッドを追加/確認したい

## Conversion Endpoints (gRPC)

サービス名: `LexicalConverter`

### Requests
- `ConvertRequest { lexicalJson: string }`
- `MarkdownToLexicalRequest { markdown: string }`

### Responses
- `ConvertResponse { success: boolean, result: string, errorMessage?: string, processingTimeMs: number, unknownNodes: string[] }`

### Methods
- `ToHtml(ConvertRequest)`
- `ToMarkdown(ConvertRequest)`
- `ToPlainText(ConvertRequest)`
- `FromMarkdown(MarkdownToLexicalRequest)`

## .NET (Pecus.Libs) Usage Pattern

`LexicalConverterService` が gRPC クライアントを内包。`x-api-key` を Metadata に付与して呼び出す。

### Behavioral Notes
- 入力が空文字/空白のときは成功扱いで空結果を返す（Markdown → Lexical は空の EditorState を返す）。
- `unknownNodes` があればログに警告を出す。
- 例外は握りつぶさず `Success=false` と `ErrorMessage` を返す。

## NestJS (pecus.LexicalConverter) Server Pattern

`lexical.controller.ts` の gRPC ハンドラが基準。

### Behavioral Notes
- 例外時は `success=false` と `errorMessage` を返す。
- `processingTimeMs` を必ず計測する。
- `unknownNodes` は必ず配列で返す。

## Implementation Checklist

1. 変換タイプに合わせて `LexicalConverterService` のメソッドを呼ぶ。
2. `x-api-key` を Metadata に付与する。
3. `ConvertResponse` で `success/result/errorMessage/processingTimeMs/unknownNodes` を正しく設定。
4. 入力が空のケースを安全に扱う。

## Pitfalls

- `unknownNodes` の未返却は NG。
- 空 Markdown のときは空の EditorState を返す。
- `errorMessage` は `Error` 以外の例外でも必ず埋める。

## References

- `pecus.Libs/Lexical/LexicalConverterService.cs`
- `pecus.LexicalConverter/src/lexical/lexical.controller.ts`
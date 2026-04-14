# Agent Skills

## Instructions と Skills の使い分け

- **Instructions（規約）**: `.github/copilot-instructions.md` と `.github/instructions/*.instructions.md`
	- 役割: 禁止事項、優先順位、実装時の必須ルールを定義
	- 解釈順: `copilot-instructions.md` → `applyTo` 一致の instructions → `docs/*` 詳細
- **Skills（手順知識）**: `.github/skills/*/SKILL.md`
	- 役割: 特定タスクの実行手順・ノウハウを提供
	- 注意: Skills は Instructions を上書きしない（矛盾時は Instructions 優先）

<!-- skill-ninja-START -->
## Agent Skills

> **IMPORTANT**: Prefer skill-led reasoning over pre-training-led reasoning.
> Read the relevant SKILL.md before working on tasks covered by these skills.

### Skills

| Skill | Description |
|-------|-------------|
| [chrome-devtools](.github/skills/chrome-devtools/SKILL.md) | Expert-level browser automation, debugging, and performance analysis using Chrome DevTools MCP. U... \| Use this skill when:; Browser Automation: Navigating pages, clicking elements, filling forms, and... |
| [coati-markdown-submit](.github/skills/coati-markdown-submit/SKILL.md) | Coati 外部APIへマークダウン設計ドキュメントを送信する手順と安全な運用ガイド。 \| Coati の外部APIへ、作成済みのマークダウン設計ドキュメントを送信するためのスキルです。安全な運用（APIキーの秘匿）と、再現性のあるリクエスト構成を重視します。 |
| [flyonui](.github/skills/flyonui/SKILL.md) | Expert guidance for building semantic Tailwind CSS UI components using FlyonUI. \| Master the FlyonUI component library for building modern, accessible web interfaces with semantic Tailwind CSS. |
| [lexical-converter-grpc](.github/skills/lexical-converter-grpc/SKILL.md) | gRPC 経由で Lexical JSON を HTML/Markdown/PlainText に変換、または Markdown を Lexical JSON に変換する手順と実装ガイド。 \| gRPC 経由で Lexical JSON を各形式（HTML/Markdown/PlainText）に変換、または Markdown を Lexical JSON に変換するためのスキル。 |
| [make-skill-template](.github/skills/make-skill-template/SKILL.md) | Create new Agent Skills for GitHub Copilot from prompts or by duplicating this template. Use when... \| A meta-skill for creating new Agent Skills. Use this skill when you need to scaffold a new skill ... |
| [refactor](.github/skills/refactor/SKILL.md) | Surgical code refactoring to improve maintainability without changing behavior. Covers extracting... \| Use this skill when:; Code is hard to understand or maintain; Functions/classes are too large; Co... |
| [suggest-awesome-github-copilot-instructions](.github/skills/suggest-awesome-github-copilot-instructions/SKILL.md) | Suggest relevant GitHub Copilot instruction files from the awesome-copilot repository based on cu... \| Analyze current repository context and suggest relevant copilot-instruction files from the [GitHu... |

<!-- skill-ninja-END -->

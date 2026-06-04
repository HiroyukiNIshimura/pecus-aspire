# Agent Skills

## Instructions と Skills の使い分け

- **Instructions（規約）**: `.github/copilot-instructions.md` と `.github/instructions/*.instructions.md`
	- 役割: 禁止事項、優先順位、実装時の必須ルールを定義
	- 解釈順: `copilot-instructions.md` → `applyTo` 一致の instructions → `docs/*` 詳細
- **Skills（手順知識）**: `.github/skills/*/SKILL.md`
	- 役割: 特定タスクの実行手順・ノウハウを提供
	- 注意: Skills は Instructions を上書きしない（矛盾時は Instructions 優先）

<!-- agent-ninja-START -->
## Agent Skills

> **IMPORTANT**: Prefer skill-led reasoning over pre-training-led reasoning.
> See [Agent Skills](.github/skills/README.md) before working on tasks covered by these skills.

<!-- agent-ninja-END -->

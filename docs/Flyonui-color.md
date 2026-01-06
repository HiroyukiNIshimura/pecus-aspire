# FlyonUI カラーパレットガイドライン

## AI エージェント向け要約（必読）

- **コンテキスト**: FlyonUI のセマンティックカラー使用ルール。
- **重要ルール**:
  - **セマンティックカラー**: ✅→`primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error` を使用する。❌→`ghost`
  - **クラス名**: `bg-primary`, `text-primary`, `btn-primary` のように使用。
  - **禁止事項**: `ghost` はセマンティックカラーではない。
  - **コンテンツカラー**: 背景色の上には対応するコンテンツカラーを使用（例: `bg-primary` 上には `text-primary-content`）。

## 概要

FlyonUIは、次のようなセマンティックカラーユーティリティクラスの使用を推奨しています。

- `bg-primary`
- `bg-info`
- `bg-error`

これらのセマンティッククラスは、複数のモード（ダークテーマやライトテーマなど）にわたるテーマのカスタマイズと管理を簡素化します。各テーマは、CSS変数を介してこれらのクラスに動的に色を割り当てるため、テーマの変更にデザインを簡単に適応させることができます。

### セマンティックカラーのサンプル

```html
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-error">Error</button>
```

**注意**: `ghost` はセマンティックカラーではありません。`btn-ghost` は存在しますが、`bg-ghost` や `text-ghost` は存在しません。

## FlyonUIで利用可能なカラーオプション

FlyonUIは、テーマ内またはユーティリティクラスとして使用できる包括的なカラーオプションのリストを提供します。

| 色 | CSS変数 | 説明 | FlyonUIでの使用例 |
| --- | ----- | --- | ------------ |
| プライマリ | `var(--color-primary)` | ブランドまたはコアアクションを表すために使用されるメインカラー。 | `bg-primary` |
| プライマリコンテンツ | `var(--color-primary-content)` | コントラストのためにプライマリ背景色の上に使用される前景色。 | `text-primary-content` |
| セカンダリ | `var(--color-secondary)` | 補色のアクセントカラー。通常はプライマリカラーをサポートするために使用されます。 | `bg-secondary` |
| セカンダリコンテンツ | `var(--color-secondary-content)` | セカンダリ背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-secondary-content` |
| アクセント | `var(--color-accent)` | デザインの特定の部分を強調するために使用されるアクセントカラー。 | `bg-accent` |
| アクセントコンテンツ | `var(--color-accent-content)` | アクセント背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-accent-content` |
| ニュートラル | `var(--color-neutral)` | 背景や境界線などの非セマンティック要素に使用されるニュートラルカラー。 | `bg-neutral` |
| ニュートラルコンテンツ | `var(--color-neutral-content)` | ニュートラル背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-neutral-content` |
| ベース100 | `var(--color-base-100)` | ページのメイン背景色。 | `bg-base-100` |
| ベース200 | `var(--color-base-200)` | カードやセクションなどの要素に使用されるセカンダリ背景色。 | `bg-base-200` |
| ベース300 | `var(--color-base-300)` | 境界線や区切り線などの要素に使用されるターシャリ背景色。 | `bg-base-300` |
| ベースコンテンツ | `var(--color-base-content)` | ベース背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-base-content` |
| インフォ | `var(--color-info)` | 情報メッセージやアラートに使用される色。 | `bg-info` |
| インフォコンテンツ | `var(--color-info-content)` | インフォ背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-info-content` |
| サクセス | `var(--color-success)` | 成功メッセージやアラートに使用される色。 | `bg-success` |
| サクセスコンテンツ | `var(--color-success-content)` | サクセス背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-success-content` |
| ワーニング | `var(--color-warning)` | 警告メッセージやアラートに使用される色。 | `bg-warning` |
| ワーニングコンテンツ | `var(--color-warning-content)` | ワーニング背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-warning-content` |
| エラー | `var(--color-error)` | エラーメッセージやアラートに使用される色。 | `bg-error` |
| エラーコンテンツ | `var(--color-error-content)` | エラー背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | `text-error-content` |

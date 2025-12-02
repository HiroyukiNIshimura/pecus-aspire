FlyonUIは、次のようなセマンティックカラーユーティリティクラスの使用を推奨しています。

bg-primary
bg-info
bg-error
これらのセマンティッククラスは、複数のモード（ダークテーマやライトテーマなど）にわたるテーマのカスタマイズと管理を簡素化します。各テーマは、CSS変数を介してこれらのクラスに動的に色を割り当てるため、テーマの変更にデザインを簡単に適応させることができます

semantic-colorのサンプル： btn-{semantic-color}
Here are the code snippets for the block component:
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
**ghost**
semantic-colorにghostは存在しません。

## FlyonUIで利用可能なカラーオプション
FlyonUIは、テーマ内またはユーティリティクラスとして使用できる包括的なカラーオプションのリストを提供します。以下は、利用可能なカラーオプションとその使用例の表です。

| 色 | CSS変数 | 説明 | FlyonUIでの使用例 |
| --- | ----- | --- | ------------ |
| プライマリ | <span zn_id="105" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-primary)</span> | ブランドまたはコアアクションを表すために使用されるメインカラー。 | <span zn_id="138" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-primary</span> |
| プライマリコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-primary-content)</span> | コントラストのためにプライマリ背景色の上に使用される前景色。 | <span zn_id="81" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-primary-content</span> |
| セカンダリ | <span zn_id="89" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-secondary)</span> | 補色のアクセントカラー。通常はプライマリカラーをサポートするために使用されます。 | <span zn_id="83" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-secondary</span> |
| セカンダリコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-secondary-content)</span> | セカンダリ背景色のテキストとコンテンツに、良好なコントラストのために使用されます。 | <span zn_id="127" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-secondary-content</span> |
| アクセント | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-accent)</span> | 主要なUI要素を強調表示したり、特定のアクションに注意を向けたりするために使用されます。 | <span zn_id="114" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-accent</span> |
| アクセントコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-accent-content)</span> | アクセント背景色の上にあるテキストとコンテンツに、コントラストのために使用されます。 | <span zn_id="116" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-accent-content</span> |
| ニュートラル | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-neutral)</span> | ニュートラルな背景色。目立たない要素や表面に使用される。 | <span zn_id="118" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-neutral</span> |
| ニュートラルコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-neutral-content)</span> | ニュートラルな背景色のテキストとコンテンツに、読みやすさを確保するために使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-neutral-content</span> |
| ベース100 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-base-100)</span> | 最も明るい表面色。一般的な背景やページコンテンツに最適です。 | <span zn_id="131" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-base-100</span> |
| ベース200 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-base-200)</span> | やや暗い色合い。通常、背景が強調されたセクションや要素に使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-base-200</span> |
| ベース300 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-base-300)</span> | より暗い要素やより深い影の効果で高さを表現するために使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">shadow-base-300</span> |
| ベースコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-base-content)</span> | ベースカラーの背景にある要素の前景色。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-base-content</span> |
| 情報 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-info)</span> | UI内の情報メッセージや役立つヒントに使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-info</span> |
| 情報コンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-info-content)</span> | 視認性を高めるために情報背景の上で使用するテキストの色。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-info-content</span> |
| 成功 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-success)</span> | 成功または正常な状態を示します。成功メッセージやアクションでよく使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-success</span> |
| 成功コンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-success-content)</span> | 読みやすさを維持するために、成功背景の上のコンテンツとテキストに使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-success-content</span> |
| 警告 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-warning)</span> | 潜在的な問題や警告をユーザーに警告するために使用されます。 | <span zn_id="172" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-warning</span> |
| 警告コンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-warning-content)</span> | 視認性を高めるために、警告背景の上にあるテキストまたはアイコンのコンテンツ色を指定します。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-warning-content</span> |
| エラー | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-error)</span> | エラーまたは危険メッセージを示します。通常、警告または破壊的なアクションに使用されます。 | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">bg-error</span> |
| エラーコンテンツ | <span style="box-sizing: border-box;
  border-color:oklch(0.3757 0.0222 281.8);border-image: none 100% / 1 / 0 stretch;
  border-radius: 3.40282e+38px;width:fit-content;color:oklch(0.3757 0.0222 281.8);
  background-size: auto, 0%;background-color:oklab(0.93757 0.000453981 -0.00217309);
  --badge-border: none;--badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">var(--color-error-content)</span> | エラー背景上に配置されたテキストと要素のコンテンツカラー。 | <span zn_id="179" style="box-sizing: border-box;border-color:oklch(0.3757 0.0222 281.8);
  border-image: none 100% / 1 / 0 stretch;border-radius: 3.40282e+38px;
  width:fit-content;color:oklch(0.3757 0.0222 281.8);background-size: auto, 0%;
  background-color:oklab(0.93757 0.000453981 -0.00217309);--badge-border: none;
  --badge-bg: color-mix(in oklab,oklch(37.57% .0222 281.8)10%,oklch(100% 0 0));
  --badge-fg: oklch(37.57% .0222 281.8);--size: calc(.25rem*5);justify-content: center;
  align-items: center;gap: 0.375rem;padding-inline: 0.5rem;display:inline-flex;
  text-wrap: nowrap">text-error-content</span> |


## 利用可能なユーティリティクラス
FlyonUIのカラーユーティリティは、Tailwindのデフォルトのカラーユーティリティと同様のパターンに従います。次の構文を使用して、UIのさまざまな側面に簡単に色を適用できます。

  | CSSクラス |
| ------ |
| bg-{COLOR\_NAME} |
| text-{COLOR\_NAME} |
| border-{COLOR\_NAME} |
| from-{COLOR\_NAME} |
| via-{COLOR\_NAME} |
| to-{COLOR\_NAME} |
| ring-{COLOR\_NAME} |
| fill-{COLOR\_NAME} |
| stroke-{COLOR\_NAME} |
| shadow-{COLOR\_NAME} |
| outline-{COLOR\_NAME} |
| divide-{COLOR\_NAME} |
| accent-{COLOR\_NAME} |
| caret-{COLOR\_NAME} |
| デコレーション-{カラー名} |
| プレースホルダ-{カラー名} |
| リングオフセット-{カラー名} |

例：

背景色：bg-primary
テキスト色：text-secondary
境界線の色：border-accent
影の色：shadow-primary
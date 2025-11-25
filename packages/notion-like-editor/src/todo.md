* 日本語化
* Codeデザインをユーザー設定から
* AutocompleteServerの固定辞書を前に作ったサジェスションみたいなのにしたい
* ステッキーNote
* Equation

現在緩和している主なルール：

biome.json:

noExplicitAny - any 型の使用
useExhaustiveDependencies - useEffect 等の依存配列
noUnusedVariables - 未使用変数（warn）
その他 a11y 関連ルール
biome.json:

同様のルール緩和
将来厳しくする際の優先順位案：

noExplicitAny → 型安全性向上
useExhaustiveDependencies → React hooks のバグ防止
noUnusedVariables → コードクリーンアップ
a11y ルール → アクセシビリティ向上
パッケージ化が進んで安定したら、段階的に厳しくしていきましょう！
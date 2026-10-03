---
name: coati-help-author
description: 'Coatiの日本語ヘルプ記事をコードベースで調査し、ローカル画面のキャプチャとともに作成・更新する手順。ヘルプページ、Markdownガイド、画面キャプチャ、public/help/imagesへの配置を依頼されたときに使用する。'
argument-hint: '対象の機能・画面、記事の新規作成か更新かを指定'
---

# Coati ヘルプ記事の作成

## 対象
- 画像形式はWebPに統一する。JPEG/JPGは変換用の一時素材としてのみ扱い、プロジェクトルートの `scripts/convert-to-webp.js` でWebPを生成して存在確認する。記事MarkdownからJPEG/JPGを直接参照しない。この規則は本書中の拡張子例より優先する。
- Markdown: `pecus.Frontend/src/content/help/ja/*.md`
- 画像: `pecus.Frontend/public/help/images/*.webp`（JPG/JPEGを受け取った場合は変換スクリプトでWebP化）
- 既存記事・画面・ソース実装を確認し、実証できた内容だけを記事にする。

## 参照するもの
- `docs/spec/help-system-implementation.md` — ヘルプ形式、Markdownと画像の仕様
- `pecus.Frontend/src/libs/help/getHelpContent.ts` — 記事ファイルの取得と順序
- `pecus.Frontend/scripts/generate-help-index.ts` — 検索インデックス生成
- `scripts/convert-to-webp.js` — JPG/JPEGをWebPに変換（sharp使用、変換成功時に元画像を削除、`--keep`で保持、既存出力は上書きしない）
- `pecus.Frontend/src/content/help/ja/` — 文体・ファイル名・画像参照の既存例
- `pecus.Frontend/public/help/images/` — 既存画像のファイル名一覧と参照先の存在確認のみ（既存画像の内容は開かない）
- `.github/skills/coati-help-author/SKILL.md` — この作業手順
- `.github/skills/chrome-devtools/SKILL.md` — Chrome DevToolsのページ一覧・ページID指定撮影
- VS Code共有統合ブラウザー — `mcp_playwright_browser_snapshot` / `mcp_playwright_browser_find` / `mcp_playwright_browser_click` / `mcp_playwright_browser_navigate` で閲覧・操作し、`mcp_playwright_browser_take_screenshot` でファイル保存する
- Chrome DevTools — `mcp_chrome_devtoo_list_pages`でlocalhostタブを探し、`mcp_chrome_devtoo_take_snapshot` / `mcp_chrome_devtoo_take_screenshot`をpageId指定で利用する。スクリーンショットはワークスペース絶対パスのfilePathで保存する
- 対象機能に関連する実装ファイルのみ: `pecus.Frontend/src/app/**`、`pecus.Frontend/src/components/**`、`pecus.Frontend/src/actions/**`、`pecus.Frontend/src/libs/**`、`pecus.Frontend/src/connectors/api/**`

## 安全境界
- `mcp_playwright_browser_snapshot`が`about:blank`を返した場合も撮影不能とは判断しない。共有ページIDの`screenshot_page`を試し、添付のみの結果ならChrome DevToolsの`mcp_chrome_devtoo_list_pages`でlocalhostタブを探して`pageId`指定の`mcp_chrome_devtoo_take_screenshot`を使う。ほかのホストのタブは無視する。
1. VS Codeの共有統合ブラウザーに対象ページがある場合はそれを再利用する。共有ページIDが添付されている場合はまずそのIDを`screenshot_page`に渡す。Playwrightが別コンテキストの`about:blank`を返す、または`screenshot_page`が添付画像のみの場合は、Chrome DevToolsの`mcp_chrome_devtoo_list_pages`でURLが `http://localhost:3000` から始まるページを探し、該当`pageId`で操作・撮影する。他ホストのタブは無視し、対象が見つからない場合だけ`open_browser_page`で明示されたlocalhost URLを開く。共有済みなのに再共有を要求しない。
2. 操作対象は `http://localhost:3000` 配下に限定する。共有ブラウザーやChrome DevToolsの一覧に他のタブがあっても、それらは選択・操作せず無視する。対象のlocalhostページが得られない場合に限り停止する。意図しない外部リダイレクトが起きたら直ちに停止し、外部リンク・別タブを開く操作はしない。
3. localhostページも外部通信を行う可能性がある。このワークスペースのCoatiヘルプ作成では、`http://localhost:3000` から発生する付随的な外部通信は利用者が許可済みなので、同一オリジンでは再確認しない。他ホストへの移動・通信が必要な場合だけ改めて確認する。
4. ファイルツールのアクセス範囲はパス単位で強制隔離されていない。検索・読み取りは「参照するもの」に列挙したパスだけを対象とし、ソースコードは指定された `src/` 配下のうち対象機能に直接関係するファイルだけを扱う。検索時はこれらのパスを対象に指定し、設定ファイル、`.env`、ログ、認証情報を検索対象にしない。画像ディレクトリはファイル名一覧・存在確認のみとし、既存画像の内容は開かない。禁止対象や対象外の情報が検索結果に含まれた場合は開かず、会話や報告にも出力しない。編集対象は必要なヘルプMarkdownと新規キャプチャ画像に限定し、プロジェクトルートの変換スクリプトはユーザーが明示的に要求した場合だけ追加・変更する。
5. 開発サーバーの起動は禁止。AppHost、`npm run dev`は起動せず、利用者が起動済みの環境を使う。
6. パスワード、Cookie、トークン、`.env`や環境設定内の秘密を読まない。Cookie、Web Storage、キャッシュ、ブラウザープロファイルを読み書き・消去しない。未ログインなら利用者に手動ログインを依頼して待つ。`.github/skills/localhost-debug-browser/SKILL.md`に記載されたデモ資格情報の例外も、この作業では使用しない。
7. 画面操作は読む・開く・絞り込むなどの確認に限定する。作成、編集保存、送信、招待、削除など永続的な変更を伴う操作は行わない。確認に必要なデータがなければ、利用者に準備を依頼する。
8. 記事本文と通常の画面表示内容は、人が必ずレビューする草稿として扱う。内容の安全性・適切さを独自に判定して文章を削除・伏せ字化したり、通常のプロフィール項目やデモ表示を理由に撮影を拒否したりしない。パスワード、Cookie、トークン、APIキーなどの認証情報・秘密値は取得・掲載しない。
9. 不確かな挙動は推測で書かず、実装・画面・既存仕様書の根拠を探す。根拠が得られない場合は記事をその点で断定せず、利用者に確認する。

## 手順
- 手順内にJPEGを記事参照に使う旧記述が残っていても従わない。画像変換の制約が優先され、記事はWebPのみ参照する。

### 1. 調査
- 対象画面のページ・コンポーネント、Server Action、関連型などを読み、操作と画面表示の根拠を確認する。
- 既存Markdownから記事タイトル、番号、節構成、画像記法を確認する。
- 新規記事なら既存の最大連番の次を使う（現在の命名例: `01-getting-started.md`）。既存記事を更新する場合は、番号やslugを不用意に変えない。

### 2. 実画面確認
- まずVS Code共有統合ブラウザーの現在ページをスナップショットで確認する。Playwright snapshotが`about:blank`なら、Chrome DevToolsのページ一覧から対象localhostページを探して続行する。両方の接続先を試す前にツール利用不可と結論しない。現在ページが対象URLと異なる場合は許可されたローカルURLだけへ移動し、ログイン画面なら利用者に手動ログインを依頼する。
- 対象の画面へ移動し、記事に記載する表示・操作が存在することを確認する。
- ログイン画面、権限エラー、データ不足、機能フラグ無効などで確認できない場合はそこで停止し、未確認内容を明記する。

### 3. キャプチャ
- スクリーンショットのファイル保存先は、実行環境のワークスペースルート（環境情報の `workspaceFolder` パス）に `pecus.Frontend/public/help/images/<未使用名>.webp` を連結した絶対パスにする。ルートのパスは環境ごとに異なるため固定値を書かず、毎回環境情報から取得する。相対パスはツールの作業ディレクトリ基準で解決され「設定済みワークスペースルート外」として拒否されることがある。`/tmp`・ツール出力フォルダーなどワークスペース外には保存できない（拒否される）。
- 保存が拒否された場合は、ワークスペース絶対パスで再試行する。それでも「ワークスペースルート外」などで失敗するときは、ブラウザー接続が古い状態を保持している可能性が高い。作業を止め、利用者に「開いているChromeと共有ブラウザーをいったん終了してから、もう一度依頼してください」と案内する。記事は編集しない。それでも失敗するときだけ`mcp_playwright_browser_take_screenshot`の`filename`に同じパスを指定する。両方でファイル保存できない場合に限り、`screenshot_page`の画像を利用者に所定フォルダーへ保存してもらう。
- 保存は`mcp_chrome_devtoo_take_screenshot`を優先し、対象localhostの`pageId`、`format: "webp"`、`filePath`に「ワークスペースルートの絶対パス + `/pecus.Frontend/public/help/images/<未使用名>.webp`」を指定する。ワークスペース外（`/tmp`など）には保存しない。
- 保存経路は、(1) 添付の共有ページIDを`screenshot_page`で確認、(2) Chrome DevToolsの`list_pages`で`http://localhost:3000`のページを探し、対応する`pageId`で`take_snapshot`と`take_screenshot`によりWebPを指定パスへ保存、の順で試す。共有Playwrightのsnapshotが`about:blank`を返すだけでは中断しない。
- 最新のアクセシビリティスナップショットで画面を把握し、必要最小限の範囲を撮る。
- Chrome DevToolsの一覧で対象localhostタブが見つかった場合は、そちらの`pageId`を使って`mcp_chrome_devtoo_take_screenshot`の`filePath`にワークスペース絶対パスを指定し、WebP画像を保存する。Chrome DevToolsに対象がなくPlaywright側で対象ページを取得できている場合のみ`mcp_playwright_browser_take_screenshot`の`filename`を使う。どちらもファイル保存できない場合は`screenshot_page`で画像を添付として取得し、JPEGなら`pecus.Frontend/public/help/images/`へ保存して次項の変換手順に進む。
- JPEGファイルを保存したら、プロジェクトルートから `node scripts/convert-to-webp.js pecus.Frontend/public/help/images/元画像.jpg` を実行して変換し、生成されたWebPファイルの存在を確認する。変換成功時に元JPEGは既定で削除される。保持する必要がある場合だけ、コマンド末尾に `--keep` を付ける。Agentはこの変換コマンドだけを実行し、それ以外のシェルコマンドは実行しない。既存出力があれば変換スクリプトは上書きせず失敗する。変換済みWebPを確認するまでMarkdownを作成・更新せず、記事はWebPだけを参照する。任意コード実行ツールでのスクリーンショット保存や画像変換は行わない。
- 既存画像一覧を調べ、現在の数値連番の次の未使用番号を選ぶ（例: `1000032.webp`）。同名ファイルを上書きしない。連番以外の既存規約が追加されていたらそちらを優先する。
- ページ全体より対象UIが見やすい範囲を優先し、ブラウザー枠や不要な余白を避ける。通常の画面表示内容は草稿として保持し、認証情報・秘密値だけは撮影・掲載しない。
- MCP撮影機能がない、ローカルページに接続できない、または画面上の認証情報・秘密値を撮影せずに除外できない場合は撮影を捏造・代替生成せず、利用者に対応を依頼する。通常のプロフィール項目やデモ値は撮影中断の理由にしない。

### 4. 記事作成
- 画面操作を説明するヘルプでは、記事Markdownを書き込む前に少なくとも1枚の実画面キャプチャを保存する。複数の主要画面を説明する場合は、可能な範囲で画面ごとに撮影する。
- 撮影ツールが使えない場合は、利用者が明示的に文章のみを依頼していない限り記事Markdownを新規作成・更新せず、撮影手段の利用可能化または画像提供を依頼する。画像なしの記事を完成扱いにしない。
- 既存記事と同じMarkdownを使う（MDXや独自フォーマットを追加しない）。
- 画像はWebPへ変換した後、`![画面の説明](/help/images/ファイル名.webp)` として参照する。JPEGを記事から直接参照しない。
- 操作手順は実際に確認できたラベル・順序に合わせる。説明とキャプチャが一致するようにする。
- 既存記事を直す場合は関係する説明と画像に変更を限定し、無関係な文面は整形し直さない。
- `src/content/help/search-index.json`は生成物として扱い、直接編集しない。

### 5. 同期と確認
- 検索インデックスは `predev` / `prebuild` でMarkdownから生成されるため、手編集・コマンド実行をしない。
- 起動済み開発環境で検索まで確認する必要があり、インデックス未同期の場合は `cd pecus.Frontend && npm run generate:help-index` を利用者に依頼する。
- Markdown内の各 `/help/images/...` が実在することを検索・ファイル一覧で確認する。
- 起動済みlocalhostで記事ページを開ける場合は、本文と画像表示を確認する。できない場合は未確認と報告する。

## 報告
- 変更したMarkdownと画像のパス
- コードで確認した対象機能と、撮影した画面
- 検索インデックス生成とブラウザー表示確認の結果
- 本文と画像は人によるレビュー前の草稿であること
- 中断・省略した内容と理由

## やってはいけないこと
- 本番・共有環境の画面を撮影する。
- 認証情報を読み出す・入力する・報告する。
- データを新規作成・更新・削除して撮影状態を作る。
- 既存画像を上書きする、または存在しない画面・画像を作ったことにする。
- 生成済み検索インデックスを直接編集する。
- `npm run dev`、`dotnet run --project pecus.AppHost`、APIクライアント生成コマンドを実行する。

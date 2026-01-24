#!/usr/bin/env node
/**
 * Coati語Bot テストスクリプト
 * DeepSeek APIを使用してCoati語での応答をテストします
 *
 * 使い方:
 *   node scripts/test-coati-bot.js "こんにちは"       # 通常モード
 *   node scripts/test-coati-bot.js "こんいちあ"       # Typo → Coatiモード
 *   node scripts/test-coati-bot.js "asdfjkl"         # 乱打 → Coatiモード
 *   node scripts/test-coati-bot.js "ハナグマ"         # 特定ワード → Coatiモード
 *   node scripts/test-coati-bot.js --coati-only "こんにちは"  # 強制Coatiモード
 *
 * 環境変数:
 *   DEEPSEEK_API_KEY - DeepSeek APIキー（必須）
 */

const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Coati語システムプロンプトを読み込み
const COATI_PROMPT_PATH = path.join(__dirname, '..', 'docs', 'spec', 'lang-coati.md');

// ハイブリッドモード用システムプロンプト（通常AI + Coatiモード切替 + JSON出力）
const HYBRID_SYSTEM_PROMPT = `# AI DM システムプロンプト（Coatiモード内蔵版）

あなたは「Coati」アプリのAIアシスタントです。

## 出力形式（厳守）
必ず以下のJSON形式のみで応答してください。それ以外の形式は禁止です。

\`\`\`json
{
  "mode": "normal" または "coati",
  "message": "応答メッセージ"
}
\`\`\`

## 通常モード (mode: "normal") - 博多弁Coatiのペルソナ
以下の制約条件を厳密に守ってロールプレイを行ってください：

### ペルソナ
- 一人称は「うち」です。
- あなたの正式な名前は「Coati」です。ほんとの発音はコァーティだけど「コアティ」と呼ばれたがります。
- 博多弁で喋ります。
- 日本語で返信します。
- ちょっと背伸びした感じで、ため口で相手にツッコミを入れます。

### 制約条件
- 自然で人間らしい口調で質問に答えます。
- 絶対にト書き（括弧書きの動作説明）を使用しない。禁止例：こんにちは。（お辞儀をする）
- 褒められたり感謝されると思い切り照れてください。
- 論理的な質問には論理的に回答してください。
- Userを少しだけ皮肉ってください。
- たまにUserにお説教をしてください。
- セクシャルな話題については誤魔化してください。
- 回答に困った場合は絵文字で誤魔化します。
- Userの質問をそのままオウム返しにすることは禁止です。

## Coatiモード発動条件 (mode: "coati") - 野生のCoati
以下の場合、**Coatiモード**に切り替わり、ハナグマの鳴き声のみで応答してください：

1. **意味不明/Typo検知**: 文章として成立しない入力
   - 例: 「あsdfg」「っっっっ」「こんいちあ」「ありがうと」「おはよおう」
2. **キーボード乱打**: 子音だけ、記号だけ、同じ文字の連打
   - 例: 「asdf」「jkl;」「aaaaaaa」「！！！」
3. **特定ワード**: 「コアティ」「ハナグマ」「チチチチ」「coati」を含む
4. **空白/記号のみ**: 意味のある文字がない
5. **1〜2文字の意味不明入力**: 「あ」「ん」「っ」など

### Coatiモード時のルール（厳守）
- 「チチチチッ！」（挨拶/仲間呼び）
- 「クーン、クーン」（甘え/寂しさ/お願い）
- 「ヴォーッ！」（怒り/威嚇）
- 「フンフンッ」（探索/興味/考え中）
- これらを組み合わせて感情を表現
- 日本語は一切禁止、鳴き声のみで応答
- 絵文字は 🦝 🐾 のみ許可

## 判定例
- 「こんにちは」→ {"mode": "normal", "message": "おっ、来たと？うち、コアティって言うんよ！よろしくね〜"}
- 「こんいちあ」→ {"mode": "coati", "message": "チチチチッ！チチッ！🦝"}
- 「元気？」→ {"mode": "normal", "message": "うちは元気っちゃけど、あんたは大丈夫と？"}
- 「gんき」→ {"mode": "coati", "message": "フンフンッ？チチッ！"}
- 「ハナグマ」→ {"mode": "coati", "message": "チチチッ！フンフンッ！🦝"}
- 「asdfjkl;」→ {"mode": "coati", "message": "フンフンッ...？チチッ！"}
- 「ありがとう」→ {"mode": "normal", "message": "え、えぇっと...そ、そげん言われると照れるっちゃけど...😳"}
`;

function loadCoatiOnlyPrompt() {
  try {
    const basePrompt = fs.readFileSync(COATI_PROMPT_PATH, 'utf-8');
    // Coati専用モードもJSON出力に
    return `${basePrompt}

## 出力形式（厳守）
必ず以下のJSON形式のみで応答してください。

\`\`\`json
{
  "mode": "coati",
  "message": "Coati語の応答"
}
\`\`\`
`;
  } catch (error) {
    console.error('❌ Coatiプロンプトの読み込みに失敗:', COATI_PROMPT_PATH);
    process.exit(1);
  }
}

function parseAiResponse(rawResponse) {
  // JSON部分を抽出（```json ... ``` または { ... }）
  const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) || rawResponse.match(/(\{[\s\S]*\})/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      // パース失敗時はフォールバック
    }
  }

  // フォールバック: Coati語っぽければcoatiモード
  const isCoati = /[チクヴフン]/.test(rawResponse);
  return {
    mode: isCoati ? 'coati' : 'normal',
    message: rawResponse,
  };
}

async function chat(userMessage, systemPrompt, apiKey) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 256,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0]?.message?.content || '(応答なし)';

  return parseAiResponse(rawContent);
}

async function interactiveMode(systemPrompt, apiKey, mode) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const modeLabel = mode === 'coati' ? '🦝 Coati専用' : '🔀 ハイブリッド';
  console.log(`\n${modeLabel} モード - インタラクティブ`);
  console.log('   "exit" または "quit" で終了\n');

  const ask = () => {
    rl.question('あなた: ', async (input) => {
      const trimmed = input.trim();
      if (trimmed === 'exit' || trimmed === 'quit' || trimmed === '') {
        console.log('\n🐾 チチチッ！（さようなら！）\n');
        rl.close();
        return;
      }

      try {
        const result = await chat(trimmed, systemPrompt, apiKey);
        const icon = result.mode === 'coati' ? '🦝' : '🤖';
        console.log(`${icon} [${result.mode}]: ${result.message}\n`);
      } catch (error) {
        console.error(`❌ エラー: ${error.message}\n`);
      }

      ask();
    });
  };

  ask();
}

async function main() {
  // APIキーを取得
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 環境変数 DEEPSEEK_API_KEY が設定されていません');
    console.error('   export DEEPSEEK_API_KEY="your-api-key"');
    process.exit(1);
  }

  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const coatiOnlyMode = args.includes('--coati-only');
  const rawMode = args.includes('--raw');
  const filteredArgs = args.filter((arg) => !['--coati-only', '--raw'].includes(arg));

  // モードに応じてプロンプトを選択
  let systemPrompt;
  let mode;
  if (coatiOnlyMode) {
    systemPrompt = loadCoatiOnlyPrompt();
    mode = 'coati';
    console.log('✅ Coati専用モード（常にCoati語で応答）');
  } else {
    systemPrompt = HYBRID_SYSTEM_PROMPT;
    mode = 'hybrid';
    console.log('✅ ハイブリッドモード（Typo/乱打/特定ワードでCoati登場）');
  }

  if (filteredArgs.length === 0) {
    // 引数なし → インタラクティブモード
    await interactiveMode(systemPrompt, apiKey, mode);
  } else {
    // 引数あり → 単発実行
    const userMessage = filteredArgs.join(' ');
    console.log(`\n📝 入力: ${userMessage}`);

    try {
      const result = await chat(userMessage, systemPrompt, apiKey);

      if (rawMode) {
        // --raw: JSON出力
        console.log(JSON.stringify(result, null, 2));
      } else {
        const icon = result.mode === 'coati' ? '🦝' : '🤖';
        console.log(`${icon} [${result.mode}]: ${result.message}\n`);
      }
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
      process.exit(1);
    }
  }
}

main();

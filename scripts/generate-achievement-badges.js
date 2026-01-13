#!/usr/bin/env node
/**
 * GPT-image-1 を使用して実績バッジ画像を生成するスクリプト
 *
 * 使用方法:
 *   OPENAI_API_KEY=sk-xxx node scripts/generate-achievement-badges.js
 *
 * オプション:
 *   --code=EARLY_BIRD   特定のバッジのみ生成
 *   --dry-run           APIを呼ばずにプロンプト表示と既存画像のWEBP変換のみ実行
 *
 * 注意:
 *   - このスクリプトは OpenAI GPT-image-1 API を使用します。APIキーが必要です。
 *   - 生成される画像は scripts/generate-achievement-badges.js と同じディレクトリの images フォルダに保存されます。
 *   - 既存の画像ファイルがある場合はスキップされます。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'images');

// ベーススタイル（全バッジ共通）
const BASE_STYLE = `Style: Cute kawaii sticker illustration, flat design with soft shadows, thick outline, vibrant colors, white background, featuring an adorable coati (South American raccoon) character. Format: Square icon suitable for profile badge, clean and simple composition.`;

// バッジ定義（SeedAchievementMastersAsync と同期）
const BADGES = [
  {
    code: 'UNKNOWN',
    filename: 'unknown.png',
    prompt: `A shadowy coati silhouette with a large floating "?" above its head, surrounded by soft sparkles and question marks of various sizes. Mysterious purple and blue gradient background. ${BASE_STYLE}`,
  },
  // WorkStyle カテゴリ
  {
    code: 'EARLY_BIRD',
    filename: 'early_bird.png',
    prompt: `A cute coati character wearing a tiny explorer hat, stretching and yawning at sunrise. Soft orange and pink morning sky in background. The coati holds a small coffee cup. ${BASE_STYLE}`,
  },
  {
    code: 'NIGHT_OWL',
    filename: 'night_owl.png',
    prompt: `A cute coati character wearing round glasses, sitting at a tiny desk with a glowing laptop. Starry night sky and crescent moon in background. Cozy warm lamp light. ${BASE_STYLE}`,
  },
  {
    code: 'WEEKEND_GUARDIAN',
    filename: 'weekend_guardian.png',
    prompt: `A relaxed coati character in a hammock under a palm tree, wearing sunglasses. Phone showing "OFF" with peaceful zzz bubbles. Beach sunset vibes. ${BASE_STYLE}`,
  },
  {
    code: 'VETERAN',
    filename: 'veteran.png',
    prompt: `A wise elderly coati character with a distinguished gray beard, sitting in a cozy armchair. Trophy shelf in background showing "1 YEAR". Warm nostalgic glow. ${BASE_STYLE}`,
  },

  // Productivity カテゴリ
  {
    code: 'INBOX_ZERO',
    filename: 'inbox_zero.png',
    prompt: `A peaceful coati character meditating in lotus position, surrounded by floating sparkles. Empty inbox icon floating above. Zen garden aesthetic with soft pastel colors. ${BASE_STYLE}`,
  },
  {
    code: 'TASK_CHEF',
    filename: 'task_chef.png',
    prompt: `A cute coati character wearing a chef's hat and apron, happily cooking with a frying pan. Checklist items floating like ingredients. Steam and sparkles. ${BASE_STYLE}`,
  },
  {
    code: 'DEADLINE_MASTER',
    filename: 'deadline_master.png',
    prompt: `A confident coati character in a superhero cape, holding a clock showing "ON TIME". Green checkmarks flying around. Dynamic pose with sparkle effects. ${BASE_STYLE}`,
  },
  {
    code: 'ESTIMATION_WIZARD',
    filename: 'estimation_wizard.png',
    prompt: `A magical coati character wearing a wizard hat and robe, casting sparkles from a wand. Floating numbers "=" perfectly balanced. Crystal ball showing accurate predictions. ${BASE_STYLE}`,
  },
  {
    code: 'SPEED_STAR',
    filename: 'speed_star.png',
    prompt: `A dynamic coati character with speed lines, wearing a red scarf flowing in the wind. Lightning bolt effects and motion blur. Energetic and fast pose. ${BASE_STYLE}`,
  },
  {
    code: 'PRIORITY_HUNTER',
    filename: 'priority_hunter.png',
    prompt: `A focused coati character with a detective magnifying glass, targeting a red "HIGH" priority flag. Determined expression, spotlight effect. ${BASE_STYLE}`,
  },
  {
    code: 'DOCUMENTER',
    filename: 'documenter.png',
    prompt: `A studious coati character wearing reading glasses, happily writing in a large book with a feather pen. Stack of organized documents. Ink bottle nearby. ${BASE_STYLE}`,
  },
  {
    code: 'STREAK_MASTER',
    filename: 'streak_master.png',
    prompt: `A triumphant coati character standing atop a mountain of stacked calendar days, holding a flame torch. Fire streak trailing behind. Achievement glow. ${BASE_STYLE}`,
  },
  {
    code: 'CENTURY',
    filename: 'century.png',
    prompt: `A strong coati character flexing muscles, surrounded by floating "100" number and golden confetti. Victory pose with sparkle crown. ${BASE_STYLE}`,
  },
  {
    code: 'MULTITASKER',
    filename: 'multitasker.png',
    prompt: `A busy but happy coati character with multiple arms juggling different colored folders and tools. Sweat drop but smiling. Organized chaos vibe. ${BASE_STYLE}`,
  },
  {
    code: 'CONNECTOR',
    filename: 'connector.png',
    prompt: `A social coati character surrounded by connected nodes and glowing lines forming a network. Holding two puzzle pieces that connect. Warm community feeling. ${BASE_STYLE}`,
  },
  {
    code: 'THOUSAND_TASKS',
    filename: 'thousand_tasks.png',
    prompt: `An epic coati character in samurai armor, surrounded by 1000 floating task cards. Dramatic wind effect, cherry blossoms. Legendary achievement aura. ${BASE_STYLE}`,
  },
  {
    code: 'PERFECT_WEEK',
    filename: 'perfect_week.png',
    prompt: `A proud coati character standing on a podium marked "7/7", wearing a gold medal. Rainbow and confetti celebration. Perfect score sparkles. ${BASE_STYLE}`,
  },

  // AI カテゴリ
  {
    code: 'AI_APPRENTICE',
    filename: 'ai_apprentice.png',
    prompt: `A curious coati character high-fiving a friendly robot companion. Digital sparkles and circuit patterns floating. Futuristic but warm atmosphere. ${BASE_STYLE}`,
  },

  // TeamPlay カテゴリ
  {
    code: 'BEST_SUPPORTING',
    filename: 'best_supporting.png',
    prompt: `A helpful coati character giving a thumbs up while supporting another smaller coati on shoulders. Teamwork sparkles, warm golden glow. ${BASE_STYLE}`,
  },
  {
    code: 'COMMENTATOR',
    filename: 'commentator.png',
    prompt: `A cheerful coati character with a megaphone, surrounded by floating speech bubbles with hearts and stars. Energetic broadcasting pose. ${BASE_STYLE}`,
  },
  {
    code: 'UNSUNG_HERO',
    filename: 'unsung_hero.png',
    prompt: `A humble coati character in a knight's armor, quietly holding a shield protecting smaller animals. Soft golden halo, modest pose. ${BASE_STYLE}`,
  },
  {
    code: 'SAVIOR',
    filename: 'savior.png',
    prompt: `A heroic coati character with angel wings, extending a helping hand downward with glowing light. Dramatic rescue pose, divine sparkles. ${BASE_STYLE}`,
  },

  // Quality カテゴリ
  {
    code: 'FIRST_TRY',
    filename: 'first_try.png',
    prompt: `A precise coati character as an archer, arrow hitting perfect bullseye on first shot. Target with "100%" mark. Confident smile. ${BASE_STYLE}`,
  },
  {
    code: 'LEARNER',
    filename: 'learner.png',
    prompt: `A determined coati character getting back up after falling, with growth chart showing upward trend. Phoenix-like rising pose, inspirational glow. ${BASE_STYLE}`,
  },

  // Reliability カテゴリ
  {
    code: 'STEADY_HAND',
    filename: 'steady_hand.png',
    prompt: `A reliable coati character standing firmly like a rock, holding a flag marked "START TO FINISH". Anchor symbol, stable foundation. ${BASE_STYLE}`,
  },
  {
    code: 'PROMISE_KEEPER',
    filename: 'promise_keeper.png',
    prompt: `A trustworthy coati character holding a golden seal/stamp, with a contract and handshake symbol. Noble and reliable expression. ${BASE_STYLE}`,
  },
  {
    code: 'AHEAD_OF_SCHEDULE',
    filename: 'ahead_of_schedule.png',
    prompt: `A speedy coati character running past a calendar, pushing deadline earlier. Time warp effect, clock hands spinning backward. Proactive energy. ${BASE_STYLE}`,
  },
  {
    code: 'EVIDENCE_KEEPER',
    filename: 'evidence_keeper.png',
    prompt: `A meticulous coati character with a camera and clipboard, organizing photos in a neat folder. Filing cabinet with labels. Detective-like attention to detail. ${BASE_STYLE}`,
  },
];

async function generateImage(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  // gpt-image-1 は b64_json を返す
  return data.data[0];
}

async function downloadAndSave(imageData, filepath) {
  let buffer;

  if (imageData.b64_json) {
    // Base64形式の場合
    buffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    // URL形式の場合（フォールバック）
    const response = await fetch(imageData.url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    throw new Error('No image data received');
  }

  fs.writeFileSync(filepath, buffer);
  //画像をWEBP形式に変換して保存
  await sharp(buffer).webp({ quality: 90 }).toFile(filepath.replace('.png', '.webp'));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const codeArg = args.find((a) => a.startsWith('--code='));
  const targetCode = codeArg ? codeArg.split('=')[1] : null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=sk-xxx node scripts/generate-achievement-badges.js');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  const badgesToGenerate = targetCode ? BADGES.filter((b) => b.code === targetCode) : BADGES;

  if (badgesToGenerate.length === 0) {
    console.error(`Error: Badge with code "${targetCode}" not found`);
    process.exit(1);
  }

  console.log(`Generating ${badgesToGenerate.length} badge(s)...`);
  console.log('');

  for (const badge of badgesToGenerate) {
    const filepath = path.join(OUTPUT_DIR, badge.filename);

    console.log(`[${badge.code}] ${badge.filename}`);

    if (dryRun) {
      console.log(`  Prompt: ${badge.prompt.substring(0, 100)}...`);
      console.log('');
      if (fs.existsSync(filepath)) {
        // 既存ファイルがある場合はWEBP変換のみ実行
        console.log(`  Converting existing PNG to WEBP...`);
        const buffer = fs.readFileSync(filepath);
        await sharp(buffer).webp({ quality: 90 }).toFile(filepath.replace('.png', '.webp'));
        console.log(`  Saved to: ${filepath.replace('.png', '.webp')}`);
      }
      console.log('');
      continue;
    }

    // 既存ファイルがある場合はスキップ
    if (fs.existsSync(filepath)) {
      console.log(`  Skipped (already exists)`);
      console.log('');
      continue;
    }

    try {
      console.log(`  Generating...`);
      const imageData = await generateImage(apiKey, badge.prompt);

      console.log(`  Downloading...`);
      await downloadAndSave(imageData, filepath);

      console.log(`  Saved to: ${filepath}`);
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }

    console.log('');

    // レート制限対策: 1秒待機
    if (!dryRun) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

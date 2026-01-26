#!/usr/bin/env node
/**
 * GPT-image-1 を使用してBotアイコン画像を生成するスクリプト
 *
 * 使用方法:
 *   OPENAI_API_KEY=sk-xxx node scripts/generate-bot-icons.js
 *
 * オプション:
 *   --code=CHAT_BOT     特定のBotのみ生成
 *   --dry-run           APIを呼ばずにプロンプト表示と既存画像のWEBP変換のみ実行
 *
 * 注意:
 *   - このスクリプトは OpenAI GPT-image-1 (DALL-E 3) API を使用します。APIキーが必要です。
 *   - 生成される画像は scripts/images フォルダに保存されます。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'images');

// ベーススタイル（Botアイコン用統一スタイル）
const BASE_STYLE = `Style: High-quality anime-style close-up face portrait, designed for a circular profile icon. The character's face is perfectly centered with a little margin around the head to ensure nothing important is cut off when cropped into a circle. Vibrant colors, expressive eyes, simple or soft-focus background.`;

// Bot定義（pecus.Libs/AI/BotPersonaHelper.cs のペルソナに基づく）
const BOTS = [
  {
    code: 'CHAT_BOT',
    filename: 'bot_coati.png',
    prompt: `Character: "Coati", a cute anthropomorphic female Coati (South American coati) girl. Close-up of her face. She has brown hair, fluffy round animal ears. She is wearing a green casual adventurer's scarf. Expression: Cheerful, confident, and slightly cheeky/sassy smile (winking or sticking tongue out slightly). She looks friendly and energetic. The composition focuses on her head and shoulders. ${BASE_STYLE}`,
  },
  {
    code: 'SYSTEM_BOT',
    filename: 'bot_butler.png',
    prompt: `Character: "Butler", a cute anthropomorphic Coati (South American raccoon) dressed as a refined butler. Close-up of his face. He is wearing a formal black tuxedo collar and a bow tie. He wears rimless glasses or a monocle, giving him an intelligent and reliable look. Looking straight at the camera. Expression: Polite, calm, and professional with a gentle smile. ${BASE_STYLE}`,
  },
  {
    code: 'WILD_BOT',
    filename: 'bot_wild.png',
    // アニメ調（BASE_STYLE）は維持しつつ、デフォルメを抑えて野生動物としての構造（Feral）を強調する
    prompt: `Character: A wild Coati (South American raccoon). Feral form (animal shape), NOT anthropomorphic, NO clothes. While keeping the anime art style matching the other characters, the anatomy should be true to a real coati (long snout, small eyes compared to head). Not a "chibi" or "mascot" deformation. Expression: Wild and curious. Portrait framing designed for a circular profile icon. ${BASE_STYLE}`,
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
      model: 'dall-e-3', // bot-iconsは品質重視でdall-e-3を指定（generate-achievement-badges.jsはgpt-image-1=dall-e-3を使用）
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // アイコンなのでstandardで十分だが、必要ならhd
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  // DALL-E 3 は url または b64_json を返す
  return data.data[0];
}

async function downloadAndSave(imageData, filepath) {
  let buffer;

  if (imageData.b64_json) {
    buffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    const response = await fetch(imageData.url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    throw new Error('No image data received');
  }

  fs.writeFileSync(filepath, buffer);
  // 画像をWEBP形式に変換して保存 (サイズを最適化)
  await sharp(buffer)
    .resize(512, 512) // アイコン用にリサイズ
    .webp({ quality: 90 })
    .toFile(filepath.replace('.png', '.webp'));

  console.log(`  Saved PNG and converted to WEBP (512x512)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const codeArg = args.find((a) => a.startsWith('--code='));
  const targetCode = codeArg ? codeArg.split('=')[1] : null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=sk-xxx node scripts/generate-bot-icons.js');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  const botsToGenerate = targetCode ? BOTS.filter((b) => b.code === targetCode) : BOTS;

  if (botsToGenerate.length === 0) {
    console.error(`Error: Bot with code "${targetCode}" not found`);
    process.exit(1);
  }

  console.log(`Generating ${botsToGenerate.length} bot icon(s)...`);
  console.log('');

  for (const bot of botsToGenerate) {
    const filepath = path.join(OUTPUT_DIR, bot.filename);

    console.log(`[${bot.code}] ${bot.filename}`);

    if (dryRun) {
      console.log(`  Prompt: ${bot.prompt}`);
      console.log('');
      if (fs.existsSync(filepath)) {
        console.log(`  Converting existing PNG to WEBP...`);
        const buffer = fs.readFileSync(filepath);
        await sharp(buffer).resize(512, 512).webp({ quality: 90 }).toFile(filepath.replace('.png', '.webp'));
        console.log(`  Saved to: ${filepath.replace('.png', '.webp')}`);
      }
      console.log('');
      continue;
    }

    if (fs.existsSync(filepath)) {
      console.log(`  Skipped (already exists) - Delete file to regenerate`);
      console.log('');
      continue;
    }

    try {
      console.log(`  Generating...`);
      const imageData = await generateImage(apiKey, bot.prompt);

      console.log(`  Downloading and processing...`);
      await downloadAndSave(imageData, filepath);

      console.log(`  Done.`);
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }

    console.log('');

    // レート制限対策
    if (!dryRun) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('All done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
